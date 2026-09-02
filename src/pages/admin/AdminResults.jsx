import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/results').then((res) => setResults(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading results…</p>;

  return (
    <div className="card">
      <h3 className="card-title">All student results</h3>
      {results.length === 0 ? (
        <div className="empty-state">No submissions yet.</div>
      ) : (
        <table>
          <thead><tr><th>Student</th><th>Matric No.</th><th>Exam</th><th>Score</th><th>%</th><th>Date</th></tr></thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td>{r.studentName}</td>
                <td>{r.matricNumber}</td>
                <td>{r.examTitle}</td>
                <td>{r.totalMarksObtained}/{r.totalPossibleMarks}</td>
                <td>{r.percentage}%</td>
                <td>{new Date(r.gradingTime).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
