using EExam.Api.Models;

namespace EExam.Api.DTOs;

public record QuestionCreateDto(
    string Text,
    QuestionType QuestionType,
    List<string>? Options,
    string CorrectAnswer,
    int Marks,
    int CourseId
);

public record QuestionDto(
    int Id,
    string Text,
    QuestionType QuestionType,
    List<string>? Options,
    string CorrectAnswer,
    int Marks,
    int CourseId,
    string? CourseCode
);
