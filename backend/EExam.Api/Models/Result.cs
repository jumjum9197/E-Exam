namespace EExam.Api.Models;

public class Result
{
    public int Id { get; set; }
    public int ExamAttemptId { get; set; }
    public ExamAttempt? ExamAttempt { get; set; }

    public int TotalMarksObtained { get; set; }
    public int TotalPossibleMarks { get; set; }
    public decimal Percentage { get; set; }
    public DateTime GradingTime { get; set; } = DateTime.UtcNow;
}
