import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function ResultPage() {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/results/${resultId}`).then((res) => setResult(res.data)).finally(() => setLoading(false));
  }, [resultId]);

  if (loading) return <div className="container">Loading result…</div>;
  if (!result) return <div className="container">Result not found.</div>;

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>{result.examTitle}</h2>
        <div className="score-circle" style={{ '--pct': result.percentage }}>
          <div className="score-circle-inner">
            <strong>{result.percentage}%</strong>
            <span>{result.totalMarksObtained}/{result.totalPossibleMarks} marks</span>
          </div>
        </div>
        <p className="card-sub">Graded on {new Date(result.gradingTime).toLocaleString()}</p>
        <Link className="btn btn-outline" to="/">Back to dashboard</Link>
      </div>

      {result.breakdown && (
        <div className="card" style={{ maxWidth: 780, margin: '24px auto 0' }}>
          <h3 className="card-title">Question breakdown</h3>
          {result.breakdown.map((b, idx) => (
            <div key={b.questionId} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>{idx + 1}. {b.text}</p>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Your answer: <strong>{b.selectedAnswer ?? '(no answer)'}</strong>{' '}
                {b.isCorrect ? (
                  <span className="badge badge-active">Correct (+{b.marks})</span>
                ) : (
                  <span className="badge" style={{ background: '#fdecea', color: '#a12525' }}>
                    Incorrect — correct answer: {b.correctAnswer}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
