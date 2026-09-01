namespace EExam.Api.Models;

public enum AttemptStatus
{
    InProgress = 0,
    Submitted = 1
}

public class ExamAttempt
{
    public int Id { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public ApplicationUser? Student { get; set; }

    public int ExamId { get; set; }
    public Exam? Exam { get; set; }

    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    public AttemptStatus Status { get; set; } = AttemptStatus.InProgress;

    // JSON-encoded question ids actually served to this student, in the order shown.
    // Fixed when the attempt starts so a refresh cannot reshuffle or redraw the paper,
    // and so grading scores exactly the questions this student saw.
    public string? ServedQuestionIdsJson { get; set; }

    public List<StudentAnswer> StudentAnswers { get; set; } = new();
    public Result? Result { get; set; }
}
