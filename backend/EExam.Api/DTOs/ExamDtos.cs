namespace EExam.Api.DTOs;

public record ExamCreateDto(
    string Title,
    int CourseId,
    DateTime StartTime,
    DateTime EndTime,
    int DurationMinutes,
    bool IsActive,
    bool RandomizeQuestions,
    int QuestionsToShow,
    List<int> QuestionIds
);

public record ExamListItemDto(
    int Id,
    string Title,
    string CourseCode,
    DateTime StartTime,
    DateTime EndTime,
    int DurationMinutes,
    bool IsActive,
    bool RandomizeQuestions,
    int QuestionsToShow,
    int TotalMarks,
    int QuestionCount
);

public record ExamQuestionForStudentDto(int QuestionId, string Text, string QuestionType, List<string>? Options);

public record ExamStartResponseDto(
    int AttemptId,
    string ExamTitle,
    int DurationMinutes,
    DateTime AttemptStartTime,
    List<ExamQuestionForStudentDto> Questions
);

public record SubmitAnswerDto(int QuestionId, string? SelectedAnswer);
public record SubmitExamDto(int AttemptId, List<SubmitAnswerDto> Answers);

public record QuestionResultDto(int QuestionId, string Text, string? SelectedAnswer, string CorrectAnswer, bool IsCorrect, int Marks);

public record ResultDto(
    int ResultId,
    string ExamTitle,
    int TotalMarksObtained,
    int TotalPossibleMarks,
    decimal Percentage,
    DateTime GradingTime,
    List<QuestionResultDto>? Breakdown
);
