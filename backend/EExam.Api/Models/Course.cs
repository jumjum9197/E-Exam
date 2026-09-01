namespace EExam.Api.Models;

public class Course
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public List<Question> Questions { get; set; } = new();
    public List<Exam> Exams { get; set; } = new();
}
