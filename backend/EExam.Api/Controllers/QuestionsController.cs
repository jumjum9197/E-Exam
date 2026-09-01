using System.Text.Json;
using EExam.Api.Data;
using EExam.Api.DTOs;
using EExam.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EExam.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class QuestionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public QuestionsController(ApplicationDbContext context) => _context = context;

    private static QuestionDto ToDto(Question q) => new(
        q.Id,
        q.Text,
        q.QuestionType,
        string.IsNullOrEmpty(q.OptionsJson) ? null : JsonSerializer.Deserialize<List<string>>(q.OptionsJson),
        q.CorrectAnswer,
        q.Marks,
        q.CourseId,
        q.Course?.Code
    );

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? courseId)
    {
        var query = _context.Questions.Include(q => q.Course).AsQueryable();
        if (courseId.HasValue) query = query.Where(q => q.CourseId == courseId);
        var questions = await query.ToListAsync();
        return Ok(questions.Select(ToDto));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] QuestionCreateDto dto)
    {
        var courseExists = await _context.Courses.AnyAsync(c => c.Id == dto.CourseId);
        if (!courseExists) return BadRequest(new { message = "Selected course does not exist." });

        var question = new Question
        {
            Text = dto.Text,
            QuestionType = dto.QuestionType,
            OptionsJson = dto.Options != null ? JsonSerializer.Serialize(dto.Options) : null,
            CorrectAnswer = dto.CorrectAnswer,
            Marks = dto.Marks <= 0 ? 1 : dto.Marks,
            CourseId = dto.CourseId
        };

        _context.Questions.Add(question);
        await _context.SaveChangesAsync();
        await _context.Entry(question).Reference(q => q.Course).LoadAsync();
        return Ok(ToDto(question));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] QuestionCreateDto dto)
    {
        var question = await _context.Questions.Include(q => q.Course).FirstOrDefaultAsync(q => q.Id == id);
        if (question == null) return NotFound();

        question.Text = dto.Text;
        question.QuestionType = dto.QuestionType;
        question.OptionsJson = dto.Options != null ? JsonSerializer.Serialize(dto.Options) : null;
        question.CorrectAnswer = dto.CorrectAnswer;
        question.Marks = dto.Marks <= 0 ? 1 : dto.Marks;
        question.CourseId = dto.CourseId;

        await _context.SaveChangesAsync();
        return Ok(ToDto(question));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var question = await _context.Questions.FindAsync(id);
        if (question == null) return NotFound();

        var usedInExam = await _context.ExamQuestions.AnyAsync(eq => eq.QuestionId == id);
        if (usedInExam)
            return BadRequest(new { message = "Cannot delete a question that is already part of a scheduled exam." });

        _context.Questions.Remove(question);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
