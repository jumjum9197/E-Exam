import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ExamInterface() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attemptId, setAttemptId] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [violations, setViolations] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const submitExam = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        attemptId,
        answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
          questionId: Number(questionId),
          selectedAnswer
        }))
      };
      const res = await api.post('/exams/submit', payload);
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }
      navigate(`/results/${res.data.resultId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam.');
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [attemptId, answers, navigate]);

  // Load the exam attempt
  useEffect(() => {
    api.post(`/exams/${examId}/start`)
      .then((res) => {
        const { attemptId, examTitle, durationMinutes, attemptStartTime, questions } = res.data;
        setAttemptId(attemptId);
        setExamTitle(examTitle);
        setQuestions(questions);

        const elapsedSeconds = Math.floor((Date.now() - new Date(attemptStartTime).getTime()) / 1000);
        const remaining = Math.max(0, durationMinutes * 60 - elapsedSeconds);
        setTimeRemaining(remaining);

        document.documentElement.requestFullscreen?.().catch(() => {});
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to start this exam.'))
      .finally(() => setLoading(false));
  }, [examId]);

  // Countdown timer
  useEffect(() => {
    if (!attemptId) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [attemptId, submitExam]);

  // Tab-switch / visibility detection — a core exam-security control from the thesis
  useEffect(() => {
    if (!attemptId) return;
    const handleVisibility = () => {
      if (document.hidden) {
        setViolations((prev) => {
          const next = prev + 1;
          if (next >= 3) submitExam();
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [attemptId, submitExam]);

  if (loading) return <div className="container">Loading exam…</div>;
  if (error) return <div className="container"><div className="error-banner">{error}</div></div>;

  const mins = String(Math.floor(timeRemaining / 60)).padStart(2, '0');
  const secs = String(timeRemaining % 60).padStart(2, '0');
  const q = questions[currentQ];
  const lowTime = timeRemaining <= 60;

  return (
    <div className="container">
      <div className="exam-shell">
        <div className="exam-header">
          <div>
            <div style={{ fontWeight: 700 }}>{examTitle}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Question {currentQ + 1} of {questions.length}</div>
          </div>
          <div className={`exam-timer ${lowTime ? 'low' : ''}`}>{mins}:{secs}</div>
        </div>

        {violations > 0 && (
          <div className="violation-banner">
            ⚠ Tab-switch detected ({violations}/3). The exam will auto-submit if this happens 3 times.
          </div>
        )}

        <div className="question-palette">
          {questions.map((qq, idx) => (
            <button
              key={qq.questionId}
              className={`palette-btn ${answers[qq.questionId] ? 'answered' : ''} ${idx === currentQ ? 'current' : ''}`}
              onClick={() => setCurrentQ(idx)}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {q && (
          <div className="card">
            <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>{q.text}</p>
            {q.questionType === 'FillInTheGap' ? (
              <input
                type="text"
                autoComplete="off"
                placeholder="Type your answer"
                value={answers[q.questionId] ?? ''}
                onChange={(e) => setAnswers({ ...answers, [q.questionId]: e.target.value })}
              />
            ) : (
              (q.options && q.options.length > 0 ? q.options : ['True', 'False']).map((opt) => (
                <label className="option-label" key={opt}>
                  <input
                    type="radio"
                    name={`q-${q.questionId}`}
                    value={opt}
                    checked={answers[q.questionId] === opt}
                    onChange={() => setAnswers({ ...answers, [q.questionId]: opt })}
                  />
                  {opt}
                </label>
              ))
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button className="btn btn-outline" onClick={() => setCurrentQ((c) => Math.max(0, c - 1))} disabled={currentQ === 0}>
            Previous
          </button>
          {currentQ < questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setCurrentQ((c) => Math.min(questions.length - 1, c + 1))}>
              Next
            </button>
          ) : (
            <button className="btn btn-accent" onClick={submitExam} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Exam'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
