namespace EExam.Api.Models;

public enum QuestionType
{
    MultipleChoice = 0,
    TrueFalse = 1,
    FillInTheGap = 2
}

public class Question
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }

    // JSON-encoded array of option strings, e.g. ["Paris","London","Rome","Berlin"]
    // Null/empty for True/False and fill-in-the-gap questions.
    public string? OptionsJson { get; set; }

    public string CorrectAnswer { get; set; } = string.Empty;
    public int Marks { get; set; } = 1;

    public int CourseId { get; set; }
    public Course? Course { get; set; }
}
