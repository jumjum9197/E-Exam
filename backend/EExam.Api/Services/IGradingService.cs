using EExam.Api.Models;

namespace EExam.Api.Services;

public interface IGradingService
{
    Task<Result> GradeExamAsync(int attemptId);
}
