using EExam.Api.DTOs;
using EExam.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EExam.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminsController : ControllerBase
{
    // The seeded account. It is the only one allowed to create or remove administrators,
    // and it cannot be removed itself.
    public const string SuperAdminUserName = "admin";

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public AdminsController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    private bool IsSuperAdmin =>
        string.Equals(User.Identity?.Name, SuperAdminUserName, StringComparison.OrdinalIgnoreCase);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var admins = await _userManager.GetUsersInRoleAsync("Admin");

        var result = admins
            .OrderBy(a => a.FullName)
            .Select(a => new
            {
                a.Id,
                a.UserName,
                a.Email,
                a.FullName,
                IsSuperAdmin = string.Equals(a.UserName, SuperAdminUserName, StringComparison.OrdinalIgnoreCase)
            });

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminCreateDto dto)
    {
        if (!IsSuperAdmin)
            return StatusCode(403, new { message = "Only the super admin can add administrators." });

        if (!await _roleManager.RoleExistsAsync("Admin"))
            await _roleManager.CreateAsync(new IdentityRole("Admin"));

        var user = new ApplicationUser
        {
            UserName = dto.Username,
            Email = dto.Email,
            FullName = dto.FullName
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = "Could not create administrator", errors = result.Errors.Select(e => e.Description) });

        await _userManager.AddToRoleAsync(user, "Admin");

        return Ok(new { user.Id, user.UserName, user.Email, user.FullName, message = "Administrator added successfully." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!IsSuperAdmin)
            return StatusCode(403, new { message = "Only the super admin can remove administrators." });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        if (string.Equals(user.UserName, SuperAdminUserName, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "The super admin account cannot be removed." });

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = "Could not remove administrator", errors = result.Errors.Select(e => e.Description) });

        return NoContent();
    }
}
