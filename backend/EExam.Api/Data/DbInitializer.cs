using System.Text.Json;
using EExam.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EExam.Api.Data;

public static class DbInitializer
{
    // Columns added to the model after the first release. Each one is applied only if the
    // table does not already have it, so this is safe to run on every startup.
    private static readonly (string Table, string Column, string Definition)[] AddedColumns =
    {
        ("Exams", "RandomizeQuestions", "INTEGER NOT NULL DEFAULT 0"),
        ("Exams", "QuestionsToShow", "INTEGER NOT NULL DEFAULT 0"),
        ("ExamAttempts", "ServedQuestionIdsJson", "TEXT NULL")
    };

    private static async Task EnsureColumnsAsync(ApplicationDbContext context)
    {
        // pragma_table_info is SQLite-only; a SQL Server database is expected to be managed
        // with real migrations rather than patched here.
        if (!context.Database.IsSqlite()) return;

        var connection = context.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
            await connection.OpenAsync();

        foreach (var (table, column, definition) in AddedColumns)
        {
            await using (var check = connection.CreateCommand())
            {
                check.CommandText = $"SELECT COUNT(*) FROM pragma_table_info('{table}') WHERE name = '{column}';";
                if (Convert.ToInt64(await check.ExecuteScalarAsync()) > 0) continue;
            }

            await using var alter = connection.CreateCommand();
            alter.CommandText = $"ALTER TABLE \"{table}\" ADD COLUMN \"{column}\" {definition};";
            await alter.ExecuteNonQueryAsync();
        }
    }

    public static async Task SeedAsync(IServiceProvider services)
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        // Using EnsureCreated (rather than Migrate) so the demo works with zero
        // migration setup. Switch to migrations later if the schema needs to evolve.
        await context.Database.EnsureCreatedAsync();

        // EnsureCreated only ever builds a database from scratch; it never alters one that
        // already exists. Columns added to the model after a database was first created are
        // therefore missing, and every query against that table fails. Add them here instead.
        await EnsureColumnsAsync(context);

        foreach (var role in new[] { "Admin", "Student" })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Default admin account
        if (await userManager.FindByNameAsync("admin") == null)
        {
            var admin = new ApplicationUser { UserName = "admin", Email = "admin@noun.edu.ng", FullName = "System Administrator" };
            var result = await userManager.CreateAsync(admin, "Admin@123");
            if (result.Succeeded) await userManager.AddToRoleAsync(admin, "Admin");
        }

        // Default demo student account
        if (await userManager.FindByNameAsync("student") == null)
        {
            var student = new ApplicationUser
            {
                UserName = "student",
                Email = "student@noun.edu.ng",
                FullName = "Jane Doe",
                MatricNumber = "NOU123456789"
            };
            var result = await userManager.CreateAsync(student, "Student@123");
            if (result.Succeeded) await userManager.AddToRoleAsync(student, "Student");
        }

        if (!context.Courses.Any())
        {
            var course = new Course
            {
                Code = "CIT101",
                Title = "Introduction to Computer Science",
                Description = "Foundational concepts in computing and information technology."
            };
            context.Courses.Add(course);
            await context.SaveChangesAsync();

            var questions = new List<Question>
            {
                new() {
                    Text = "Which of the following is a valid variable name in most programming languages?",
                    QuestionType = QuestionType.MultipleChoice,
                    OptionsJson = JsonSerializer.Serialize(new[] { "2value", "value_2", "value-2", "value 2" }),
                    CorrectAnswer = "value_2",
                    Marks = 2,
                    CourseId = course.Id
                },
                new() {
                    Text = "HTML stands for HyperText Markup Language.",
                    QuestionType = QuestionType.TrueFalse,
                    CorrectAnswer = "True",
                    Marks = 1,
                    CourseId = course.Id
                },
                new() {
                    Text = "Which data structure uses First-In-First-Out (FIFO) ordering?",
                    QuestionType = QuestionType.MultipleChoice,
                    OptionsJson = JsonSerializer.Serialize(new[] { "Stack", "Queue", "Tree", "Graph" }),
                    CorrectAnswer = "Queue",
                    Marks = 2,
                    CourseId = course.Id
                },
                new() {
                    Text = "SQL Server is an example of a NoSQL database.",
                    QuestionType = QuestionType.TrueFalse,
                    CorrectAnswer = "False",
                    Marks = 1,
                    CourseId = course.Id
                },
                new() {
                    Text = "Which of these is the main JavaScript library used for building the front-end in this project?",
                    QuestionType = QuestionType.MultipleChoice,
                    OptionsJson = JsonSerializer.Serialize(new[] { "Angular", "Vue", "React", "jQuery" }),
                    CorrectAnswer = "React",
                    Marks = 2,
                    CourseId = course.Id
                },
                new() {
                    Text = "The acronym CPU stands for Central _______ Unit.",
                    QuestionType = QuestionType.FillInTheGap,
                    CorrectAnswer = "Processing",
                    Marks = 2,
                    CourseId = course.Id
                }
            };

            context.Questions.AddRange(questions);
            await context.SaveChangesAsync();

            // A live exam covering all seeded questions, active right now for the demo.
            // Shuffled, and each student sits 4 of the 6 linked questions.
            var exam = new Exam
            {
                Title = "CIT101 - Continuous Assessment Test 1",
                CourseId = course.Id,
                StartTime = DateTime.UtcNow.AddMinutes(-10),
                EndTime = DateTime.UtcNow.AddDays(7),
                DurationMinutes = 20,
                IsActive = true,
                RandomizeQuestions = true,
                QuestionsToShow = 4
            };
            context.Exams.Add(exam);
            await context.SaveChangesAsync();

            foreach (var q in questions)
            {
                context.ExamQuestions.Add(new ExamQuestion { ExamId = exam.Id, QuestionId = q.Id });
            }
            await context.SaveChangesAsync();
        }
    }
}
