import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/exams'), api.get('/results/mine')])
      .then(([examsRes, resultsRes]) => {
        setExams(examsRes.data);
        setResults(resultsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">Loading your dashboard…</div>;

  const takenExamTitles = new Set(results.map((r) => r.examTitle));

  return (
    <div className="container">
      <h2>Available Examinations</h2>
      {exams.length === 0 ? (
        <div className="card empty-state">No active examinations available right now. Check back later.</div>
      ) : (
        <div className="grid grid-2">
          {exams.map((exam) => {
            const taken = takenExamTitles.has(exam.title);
            return (
              <div className="card" key={exam.id}>
                <h3 className="card-title">{exam.title}</h3>
                <p className="card-sub">
                  {exam.courseCode} · {exam.questionCount} questions · {exam.durationMinutes} mins · {exam.totalMarks} marks
                </p>
                {taken ? (
                  <span className="badge badge-inactive">Already submitted</span>
                ) : (
                  <Link className="btn btn-primary" to={`/exam/${exam.id}`}>Start Exam</Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h2 style={{ marginTop: 40 }}>My Results</h2>
      {results.length === 0 ? (
        <div className="card empty-state">You haven't completed any examinations yet.</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr><th>Exam</th><th>Score</th><th>Percentage</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.resultId}>
                  <td>{r.examTitle}</td>
                  <td>{r.totalMarksObtained} / {r.totalPossibleMarks}</td>
                  <td>{r.percentage}%</td>
                  <td>{new Date(r.gradingTime).toLocaleString()}</td>
                  <td><Link to={`/results/${r.resultId}`}>View details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
