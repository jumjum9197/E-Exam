# NOUN Electronic Examination System — How to Run It

This is the working implementation of your project: **React JS** front-end +
**C# ASP.NET Core** back-end, matching the architecture in Chapters 3 & 4 of
your report (JWT auth, role-based access, question bank, exam scheduling,
automatic grading, results).

For tomorrow's demo the back-end is pre-configured to use **SQLite** instead
of a full SQL Server install — it needs zero database setup, works the moment
you run it, and uses the exact same C# / EF Core code your thesis describes.
Switching to real SQL Server later is a one-line config change (see bottom of
this file).

---

## 1. Install prerequisites (do this first, tonight)

You need two things installed on this Windows machine:

1. **.NET 8 SDK** — https://dotnet.microsoft.com/download/dotnet/8.0
   (choose the SDK, not just the runtime)
2. **Node.js LTS** (v18 or newer) — https://nodejs.org

After installing, open a new PowerShell/Command Prompt and confirm:
```
dotnet --version      (should print 8.x.x)
node --version        (should print v18.x or newer)
```

---

## 2. Run the back-end (API)

Open a terminal in:
```
C:\Users\olajumoke.sekoni.CYBER\Desktop\noun admission\noun project\backend\EExam.Api
```

Then run:
```
dotnet restore
dotnet run
```

The first run downloads the NuGet packages (needs internet) and creates the
SQLite database file (`eexam.db`) automatically, seeded with:

- Admin login: **admin / Admin@123**
- Student login: **student / Student@123**
- A sample course (CIT101), 5 questions, and one **live exam** ready to take

Watch the terminal output for the URL it's listening on — it will look like:
```
Now listening on: http://localhost:5000
```
Keep this terminal open — the API needs to stay running.

> If the port is not 5000, open `frontend/src/services/api.js` and update the
> `baseURL` to match (e.g. `http://localhost:5000/api`).

---

## 3. Run the front-end (React app)

Open a **second** terminal in:
```
C:\Users\olajumoke.sekoni.CYBER\Desktop\noun admission\noun project\frontend
```

Then run:
```
npm install
npm run dev
```

It will print something like:
```
Local:   http://localhost:5173/
```

Open that URL in Chrome/Edge.

---

## 4. Demo it

- Log in as **admin / Admin@123** → Admin Dashboard: show Courses, Question
  Bank (add a question live), Exam Scheduling (schedule a new exam or point
  out the pre-loaded one), and Results.
- Log out, log in as **student / Student@123** → Dashboard shows the active
  exam → Start Exam → answer questions using the question palette → watch the
  countdown timer → Submit → instant graded result with a per-question
  breakdown.
- To show the anti-cheating control live: switch browser tabs during the
  exam — a warning banner appears; do it 3 times and it auto-submits.

---

## 5. Project structure

```
noun project/
├── backend/EExam.Api/       ASP.NET Core 8 Web API
│   ├── Models/               Course, Question, Exam, ExamAttempt, Result, etc.
│   ├── Data/                 EF Core DbContext + seed data
│   ├── Controllers/          Auth, Courses, Questions, Exams, Results
│   ├── Services/             GradingService (automatic grading engine)
│   └── Program.cs            JWT, Identity, CORS, Swagger wiring
└── frontend/                 React 18 (built with Vite instead of Create
    └── src/                  React App — same React framework, faster dev
        ├── pages/             Login, Register, StudentDashboard, ExamInterface,
        │                      ResultPage, admin/* (Courses, Questions, Exams, Results)
        ├── context/           AuthContext (Context API, as in your report)
        └── services/api.js    Axios client with JWT interceptor
```

**Note on tooling:** the thesis appendix references Create React App; this
build uses **Vite** instead. It is still plain React JS with Axios, React
Router, and the Context API exactly as described — Vite is simply a faster,
more modern build tool for the same framework, so it does not change
anything about the architecture you're presenting.

---

## 6. Switching from SQLite to SQL Server (optional, not needed for tomorrow)

If you later want to match "SQL Server 2019" from Chapter 4 exactly:

1. Install SQL Server Express or LocalDB (comes with Visual Studio).
2. In `backend/EExam.Api/appsettings.json`, change:
   ```json
   "DatabaseProvider": "SqlServer"
   ```
3. Delete the `eexam.db` file (SQLite) if it exists.
4. Run `dotnet run` again — it will create the `EExamSystem` database on
   LocalDB and re-seed the same demo data.

---

## 7. Troubleshooting

- **"dotnet restore" fails / no internet on the venue's Wi-Fi:** run
  `dotnet restore` and `npm install` tonight while you have internet — once
  packages are downloaded, `dotnet run` / `npm run dev` work fully offline.
- **CORS error in the browser console:** confirm the front-end is running on
  `http://localhost:5173` (the default) — that origin is already whitelisted
  in `Program.cs`. If you must use a different port, add it to the
  `Cors:AllowedOrigin` value in `appsettings.json`.
- **Port already in use:** close any other `dotnet run` / `npm run dev`
  process, or change the port in `vite.config.js` (front-end) — the back-end
  port is chosen by ASP.NET Core automatically and printed in its terminal.
