namespace EExam.Api.Models;

public class Exam
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public Course? Course { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int DurationMinutes { get; set; }
    public bool IsActive { get; set; }

    // Serve the questions in a random order per student, rather than the order they were added.
    public bool RandomizeQuestions { get; set; }

    // How many of the linked questions each student actually sits.
    // 0 (or a value >= the number linked) means every linked question is served.
    public int QuestionsToShow { get; set; }

    public List<ExamQuestion> ExamQuestions { get; set; } = new();
    public List<ExamAttempt> ExamAttempts { get; set; } = new();
}
