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
public class CoursesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public CoursesController(ApplicationDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var courses = await _context.Courses
            .Select(c => new CourseDto(c.Id, c.Code, c.Title, c.Description))
            .ToListAsync();
        return Ok(courses);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CourseCreateDto dto)
    {
        if (await _context.Courses.AnyAsync(c => c.Code == dto.Code))
            return BadRequest(new { message = "A course with this code already exists." });

        var course = new Course { Code = dto.Code, Title = dto.Title, Description = dto.Description };
        _context.Courses.Add(course);
        await _context.SaveChangesAsync();
        return Ok(new CourseDto(course.Id, course.Code, course.Title, course.Description));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CourseCreateDto dto)
    {
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return NotFound();

        course.Code = dto.Code;
        course.Title = dto.Title;
        course.Description = dto.Description;
        await _context.SaveChangesAsync();
        return Ok(new CourseDto(course.Id, course.Code, course.Title, course.Description));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var course = await _context.Courses.FindAsync(id);
        if (course == null) return NotFound();

        var hasQuestions = await _context.Questions.AnyAsync(q => q.CourseId == id);
        if (hasQuestions)
            return BadRequest(new { message = "Cannot delete a course that still has questions attached." });

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
