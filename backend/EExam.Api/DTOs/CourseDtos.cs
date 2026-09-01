namespace EExam.Api.DTOs;

public record CourseDto(int Id, string Code, string Title, string? Description);
public record CourseCreateDto(string Code, string Title, string? Description);
