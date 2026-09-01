using EExam.Api.Data;
using EExam.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EExam.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class StudentsController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public StudentsController(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var students = await _userManager.GetUsersInRoleAsync("Student");
        var studentIds = students.Select(s => s.Id).ToList();

        var examsTaken = await _context.ExamAttempts
            .Where(a => studentIds.Contains(a.StudentId) && a.Status == AttemptStatus.Submitted)
            .GroupBy(a => a.StudentId)
            .Select(g => new { StudentId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.StudentId, x => x.Count);

        var result = students
            .OrderBy(s => s.FullName)
            .Select(s => new
            {
                s.Id,
                s.UserName,
                s.Email,
                s.FullName,
                s.MatricNumber,
                ExamsTaken = examsTaken.TryGetValue(s.Id, out var count) ? count : 0
            });

        return Ok(result);
    }
}
