using System.Security.Claims;
using EExam.Api.Data;
using EExam.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EExam.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResultsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public ResultsController(ApplicationDbContext context) => _context = context;

    // Student's own result history
    [HttpGet("mine")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMine()
    {
        var studentId = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;

        var results = await _context.Results
            .Include(r => r.ExamAttempt).ThenInclude(a => a!.Exam)
            .Where(r => r.ExamAttempt!.StudentId == studentId)
            .OrderByDescending(r => r.GradingTime)
            .Select(r => new ResultDto(
                r.Id,
                r.ExamAttempt!.Exam!.Title,
                r.TotalMarksObtained,
                r.TotalPossibleMarks,
                r.Percentage,
                r.GradingTime,
                null
            ))
            .ToListAsync();

        return Ok(results);
    }

    // Detailed single result with per-question breakdown
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var studentId = User.FindFirst(ClaimTypes.NameIdentifier)!.Value;
        var isAdmin = User.IsInRole("Admin");

        var result = await _context.Results
            .Include(r => r.ExamAttempt).ThenInclude(a => a!.Exam)
            .Include(r => r.ExamAttempt).ThenInclude(a => a!.StudentAnswers)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (result == null) return NotFound();
        if (!isAdmin && result.ExamAttempt!.StudentId != studentId) return Forbid();

        var examQuestions = await _context.ExamQuestions
            .Where(eq => eq.ExamId == result.ExamAttempt!.ExamId)
            .Include(eq => eq.Question)
            .ToListAsync();

        // Only show the questions this student actually sat, in the order they were served.
        var servedJson = result.ExamAttempt!.ServedQuestionIdsJson;
        if (!string.IsNullOrEmpty(servedJson))
        {
            var servedIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(servedJson)!;
            examQuestions = servedIds
                .Select(qid => examQuestions.FirstOrDefault(eq => eq.QuestionId == qid))
                .Where(eq => eq != null)
                .Select(eq => eq!)
                .ToList();
        }

        var breakdown = examQuestions.Select(eq =>
        {
            var q = eq.Question!;
            var studentAnswer = result.ExamAttempt!.StudentAnswers.FirstOrDefault(sa => sa.QuestionId == q.Id);
            var isCorrect = studentAnswer?.SelectedAnswer != null &&
                studentAnswer.SelectedAnswer.Trim().Equals(q.CorrectAnswer.Trim(), StringComparison.OrdinalIgnoreCase);
            return new QuestionResultDto(q.Id, q.Text, studentAnswer?.SelectedAnswer, q.CorrectAnswer, isCorrect, q.Marks);
        }).ToList();

        var dto = new ResultDto(
            result.Id,
            result.ExamAttempt!.Exam!.Title,
            result.TotalMarksObtained,
            result.TotalPossibleMarks,
            result.Percentage,
            result.GradingTime,
            breakdown
        );

        return Ok(dto);
    }

    // Admin: results across all students, optionally filtered by exam
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll([FromQuery] int? examId)
    {
        var query = _context.Results
            .Include(r => r.ExamAttempt).ThenInclude(a => a!.Exam)
            .Include(r => r.ExamAttempt).ThenInclude(a => a!.Student)
            .AsQueryable();

        if (examId.HasValue)
            query = query.Where(r => r.ExamAttempt!.ExamId == examId);

        var results = await query
            .OrderByDescending(r => r.GradingTime)
            .Select(r => new
            {
                r.Id,
                ExamTitle = r.ExamAttempt!.Exam!.Title,
                StudentName = r.ExamAttempt.Student!.FullName,
                MatricNumber = r.ExamAttempt.Student.MatricNumber,
                r.TotalMarksObtained,
                r.TotalPossibleMarks,
                r.Percentage,
                r.GradingTime
            })
            .ToListAsync();

        return Ok(results);
    }
}
