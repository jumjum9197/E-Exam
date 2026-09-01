using EExam.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace EExam.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamQuestion> ExamQuestions => Set<ExamQuestion>();
    public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();
    public DbSet<StudentAnswer> StudentAnswers => Set<StudentAnswer>();
    public DbSet<Result> Results => Set<Result>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Course>().HasIndex(c => c.Code).IsUnique();

        builder.Entity<ExamQuestion>()
            .HasOne(eq => eq.Exam)
            .WithMany(e => e.ExamQuestions)
            .HasForeignKey(eq => eq.ExamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ExamQuestion>()
            .HasOne(eq => eq.Question)
            .WithMany()
            .HasForeignKey(eq => eq.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ExamAttempt>()
            .HasOne(a => a.Exam)
            .WithMany(e => e.ExamAttempts)
            .HasForeignKey(a => a.ExamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Result>()
            .HasOne(r => r.ExamAttempt)
            .WithOne(a => a.Result)
            .HasForeignKey<Result>(r => r.ExamAttemptId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentAnswer>()
            .HasOne(sa => sa.ExamAttempt)
            .WithMany(a => a.StudentAnswers)
            .HasForeignKey(sa => sa.ExamAttemptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
