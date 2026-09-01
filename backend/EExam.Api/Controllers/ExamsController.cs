using EExam.Api.Data;
using EExam.Api.DTOs;
using EExam.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EExam.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExamsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public ExamsController(ApplicationDbContext context) => _context = context;

    // How many questions a student actually sits: QuestionsToShow, capped at what is linked.
    // 0 (or anything at or above the linked count) means the whole set.
    private static int ServedCount(int questionsToShow, int linkedCount) =>
        questionsToShow <= 0 || questionsToShow > linkedCount ? linkedCount : questionsToShow;

    // GET /api/exams  -> Admin: all exams. Student: only active exams within window.
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var isAdmin = User.IsInRole("Admin");
        var query = _context.Exams
            .Include(e => e.Course)
            .Include(e => e.ExamQuestions).ThenInclude(eq => eq.Question)
            .AsQueryable();

        if (!isAdmin)
        {
            var now = DateTime.UtcNow;
            query = query.Where(e => e.IsActive && e.StartTime <= now && e.EndTime >= now);
        }

        var exams = await query.ToListAsync();

        var result = exams.Select(e =>
        {
            var served = ServedCount(e.QuestionsToShow, e.ExamQuestions.Count);
            return new ExamListItemDto(
                e.Id,
                e.Title,
                e.Course?.Code ?? "",
                e.StartTime,
                e.EndTime,
                e.DurationMinutes,
                e.IsActive,
                e.RandomizeQuestions,
                served,
                e.ExamQuestions.Take(served).Sum(eq => eq.Question?.Marks ?? 0),
                e.ExamQuestions.Count
            );
        });

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] ExamCreateDto dto)
    {
        if (dto.QuestionIds == null || dto.QuestionIds.Count == 0)
            return BadRequest(new { message = "Select at least one question for the exam." });

        if (dto.QuestionsToShow > dto.QuestionIds.Count)
            return BadRequest(new { message = $"You asked to show {dto.QuestionsToShow} questions but only selected {dto.QuestionIds.Count}." });

        var exam = new Exam
        {
            Title = dto.Title,
            CourseId = dto.CourseId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            DurationMinutes = dto.DurationMinutes,
            IsActive = dto.IsActive,
            RandomizeQuestions = dto.RandomizeQuestions,
            QuestionsToShow = dto.QuestionsToShow
        };

        _context.Exams.Add(exam);
        await _context.SaveChangesAsync();

        foreach (var qId in dto.QuestionIds)
        {
            _context.ExamQuestions.Add(new ExamQuestion { ExamId = exam.Id, QuestionId = qId });
        }
        await _context.SaveChangesAsync();

        return Ok(new { exam.Id, message = "Exam scheduled successfully." });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ExamCreateDto dto)
    {
        var exam = await _context.Exams.Include(e => e.ExamQuestions).FirstOrDefaultAsync(e => e.Id == id);
        if (exam == null) return NotFound();

        if (dto.QuestionsToShow > dto.QuestionIds.Count)
            return BadRequest(new { message = $"You asked to show {dto.QuestionsToShow} questions but only selected {dto.QuestionIds.Count}." });

        exam.Title = dto.Title;
        exam.CourseId = dto.CourseId;
        exam.StartTime = dto.StartTime;
        exam.EndTime = dto.EndTime;
        exam.DurationMinutes = dto.DurationMinutes;
        exam.IsActive = dto.IsActive;
        exam.RandomizeQuestions = dto.RandomizeQuestions;
        exam.QuestionsToShow = dto.QuestionsToShow;

        _context.ExamQuestions.RemoveRange(exam.ExamQuestions);
        foreach (var qId in dto.QuestionIds)
        {
            _context.ExamQuestions.Add(new ExamQuestion { ExamId = exam.Id, QuestionId = qId });
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Exam updated successfully." });
    }

    [HttpPatch("{id}/toggle-active")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var exam = await _context.Exams.FindAsync(id);
        if (exam == null) return NotFound();
        exam.IsActive = !exam.IsActive;
        await _context.SaveChangesAsync();
        return Ok(new { exam.Id, exam.IsActive });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var exam = await _context.Exams.FindAsync(id);
        if (exam == null) return NotFound();

        var hasAttempts = await _context.ExamAttempts.AnyAsync(a => a.ExamId == id);
        if (hasAttempts)
            return BadRequest(new { message = "Cannot delete an exam that already has student attempts." });

        _context.Exams.Remove(exam);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ---- Student exam-taking flow ----

    [HttpPost("{id}/start")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> StartExam(int id)
    {
        var studentId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value;

        var exam = await _context.Exams
            .Include(e => e.ExamQuestions).ThenInclude(eq => eq.Question)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exam == null) return NotFound(new { message = "Exam not found." });

        var now = DateTime.UtcNow;
        if (!exam.IsActive || now < exam.StartTime || now > exam.EndTime)
            return BadRequest(new { message = "This exam is not currently available." });

        // Reuse an in-progress attempt if one already exists (e.g. page refresh).
        var existingAttempt = await _context.ExamAttempts
            .FirstOrDefaultAsync(a => a.ExamId == id && a.StudentId == studentId && a.Status == AttemptStatus.InProgress);

        ExamAttempt attempt;
        if (existingAttempt != null)
        {
            attempt = existingAttempt;
        }
        else
        {
            var alreadySubmitted = await _context.ExamAttempts
                .AnyAsync(a => a.ExamId == id && a.StudentId == studentId && a.Status == AttemptStatus.Submitted);
            if (alreadySubmitted)
                return BadRequest(new { message = "You have already submitted this exam." });

            attempt = new ExamAttempt { ExamId = id, StudentId = studentId };
            _context.ExamAttempts.Add(attempt);
            await _context.SaveChangesAsync();
        }

        // Draw this student's paper once, on the first start, then reuse it. Without this a
        // refresh would redraw a different random subset and the student could fish for questions.
        List<int> servedIds;
        if (!string.IsNullOrEmpty(attempt.ServedQuestionIdsJson))
        {
            servedIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(attempt.ServedQuestionIdsJson)!;
        }
        else
        {
            var candidates = exam.ExamQuestions.Select(eq => eq.QuestionId).ToList();
            if (exam.RandomizeQuestions)
                candidates = candidates.OrderBy(_ => Random.Shared.Next()).ToList();

            servedIds = candidates.Take(ServedCount(exam.QuestionsToShow, candidates.Count)).ToList();
            attempt.ServedQuestionIdsJson = System.Text.Json.JsonSerializer.Serialize(servedIds);
            await _context.SaveChangesAsync();
        }

        var questionsById = exam.ExamQuestions
            .Where(eq => eq.Question != null)
            .ToDictionary(eq => eq.QuestionId, eq => eq.Question!);

        var questions = servedIds
            .Where(questionsById.ContainsKey)
            .Select(qid => questionsById[qid])
            .Select(q => new ExamQuestionForStudentDto(
                q.Id,
                q.Text,
                q.QuestionType.ToString(),
                string.IsNullOrEmpty(q.OptionsJson)
                    ? null
                    : System.Text.Json.JsonSerializer.Deserialize<List<string>>(q.OptionsJson)
            )).ToList();

        return Ok(new ExamStartResponseDto(attempt.Id, exam.Title, exam.DurationMinutes, attempt.StartTime, questions));
    }

    [HttpPost("submit")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SubmitExam([FromBody] SubmitExamDto dto, [FromServices] Services.IGradingService gradingService)
    {
        var studentId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value;

        var attempt = await _context.ExamAttempts
            .Include(a => a.Exam)
            .FirstOrDefaultAsync(a => a.Id == dto.AttemptId && a.StudentId == studentId);

        if (attempt == null) return NotFound(new { message = "Exam attempt not found." });
        if (attempt.Status == AttemptStatus.Submitted)
            return BadRequest(new { message = "This exam has already been submitted." });

        foreach (var ans in dto.Answers)
        {
            _context.StudentAnswers.Add(new StudentAnswer
            {
                ExamAttemptId = attempt.Id,
                QuestionId = ans.QuestionId,
                SelectedAnswer = ans.SelectedAnswer
            });
        }
        await _context.SaveChangesAsync();

        var result = await gradingService.GradeExamAsync(attempt.Id);

        return Ok(new { resultId = result.Id, message = "Exam submitted and graded." });
    }
}
