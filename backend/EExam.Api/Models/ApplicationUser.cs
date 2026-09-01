using Microsoft.AspNetCore.Identity;

namespace EExam.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public string? MatricNumber { get; set; }
}
