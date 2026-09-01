namespace EExam.Api.DTOs;

// No Role field on purpose: public sign-up always creates a student.
public record RegisterDto(string Username, string Email, string Password, string FullName, string? MatricNumber);
public record LoginDto(string Username, string Password);
public record AdminCreateDto(string Username, string Email, string Password, string FullName);
