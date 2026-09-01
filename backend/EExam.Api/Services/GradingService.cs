using EExam.Api.Data;
using EExam.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EExam.Api.Services;

// Implements: Score = Σ(marks awarded for each correctly answered question)
//             Percentage = (Score / Total Possible Marks) * 100
public class GradingService : IGradingService
{
    private readonly ApplicationDbContext _context;

    public GradingService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> GradeExamAsync(int attemptId)
    {
        var attempt = await _context.ExamAttempts
            .Include(a => a.Result)
            .FirstOrDefaultAsync(a => a.Id == attemptId)
            ?? throw new InvalidOperationException("Exam attempt not found.");

        // If already graded, just return the existing result (idempotent submit).
        if (attempt.Result != null)
        {
            return attempt.Result;
        }

        var studentAnswers = await _context.StudentAnswers
            .Where(sa => sa.ExamAttemptId == attemptId)
            .ToListAsync();

        var examQuestions = await _context.ExamQuestions
            .Where(eq => eq.ExamId == attempt.ExamId)
            .Include(eq => eq.Question)
            .ToListAsync();

        // Score only the questions this student was actually served. When the exam serves a
        // random subset, grading the whole bank would count questions they never saw as wrong.
        if (!string.IsNullOrEmpty(attempt.ServedQuestionIdsJson))
        {
            var servedIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(attempt.ServedQuestionIdsJson)!;
            examQuestions = examQuestions.Where(eq => servedIds.Contains(eq.QuestionId)).ToList();
        }

        int totalMarks = 0;
        int totalPossibleMarks = 0;

        foreach (var eq in examQuestions)
        {
            var question = eq.Question!;
            totalPossibleMarks += question.Marks;

            var studentAnswer = studentAnswers.FirstOrDefault(sa => sa.QuestionId == question.Id);
            if (studentAnswer?.SelectedAnswer != null &&
                studentAnswer.SelectedAnswer.Trim().Equals(question.CorrectAnswer.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                totalMarks += question.Marks;
            }
        }

        decimal percentage = totalPossibleMarks > 0
            ? Math.Round((totalMarks / (decimal)totalPossibleMarks) * 100, 2)
            : 0;

        var result = new Result
        {
            ExamAttemptId = attempt.Id,
            TotalMarksObtained = totalMarks,
            TotalPossibleMarks = totalPossibleMarks,
            Percentage = percentage,
            GradingTime = DateTime.UtcNow
        };

        attempt.Status = AttemptStatus.Submitted;
        attempt.EndTime = DateTime.UtcNow;

        _context.Results.Add(result);
        await _context.SaveChangesAsync();

        return result;
    }
}
