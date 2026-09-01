import { useEffect, useState } from 'react';
import api from '../../services/api';

const emptyForm = { text: '', questionType: 0, options: ['', ''], correctAnswer: '', marks: 1, courseId: '' };

const typeLabels = { 0: 'MCQ', 1: 'T/F', 2: 'Gap' };

export default function AdminQuestions() {
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const loadCourses = () => api.get('/courses').then((res) => setCourses(res.data));
  const loadQuestions = (courseId) =>
    api.get('/questions', { params: courseId ? { courseId } : {} }).then((res) => setQuestions(res.data));

  useEffect(() => { loadCourses(); loadQuestions(); }, []);
  useEffect(() => { loadQuestions(filterCourse || undefined); }, [filterCourse]);

  const resetForm = () => {
    setForm({ ...emptyForm, options: ['', ''] });
    setEditingId(null);
    setError('');
  };

  const startEdit = (q) => {
    // Keep every stored option, but never show fewer than the two starting slots.
    const options = [...(q.options ?? [])];
    while (options.length < 2) options.push('');

    setForm({
      text: q.text,
      questionType: q.questionType,
      options,
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      courseId: String(q.courseId)
    });
    setEditingId(q.id);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const isMcq = Number(form.questionType) === 0;
    const options = isMcq ? form.options.filter((o) => o.trim()) : null;

    if (isMcq && options.length < 2) {
      setError('A multiple-choice question needs at least two options.');
      return;
    }

    // Grading compares the submitted answer to CorrectAnswer as text, so an answer
    // that no longer matches an option would make the question impossible to score.
    if (isMcq && !options.some((o) => o.trim().toLowerCase() === form.correctAnswer.trim().toLowerCase())) {
      setError('Pick which option is the correct answer.');
      return;
    }

    const payload = {
      text: form.text,
      questionType: Number(form.questionType),
      options,
      correctAnswer: form.correctAnswer,
      marks: Number(form.marks),
      courseId: Number(form.courseId)
    };

    try {
      if (editingId) {
        await api.put(`/questions/${editingId}`, payload);
      } else {
        await api.post('/questions', payload);
      }
      resetForm();
      loadQuestions(filterCourse || undefined);
    } catch (err) {
      setError(err.response?.data?.message || `Could not ${editingId ? 'save' : 'create'} question.`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      if (editingId === id) resetForm();
      loadQuestions(filterCourse || undefined);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete question.');
    }
  };

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3 className="card-title">{editingId ? 'Edit question' : 'Add question'}</h3>
        {editingId && <p className="card-sub">Editing question #{editingId}. Cancel to go back to adding new ones.</p>}
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course</label>
            <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
              <option value="">Select course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Question text</label>
            <textarea rows={2} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Question type</label>
            <select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value })}>
              <option value={0}>Multiple choice</option>
              <option value={1}>True / False</option>
              <option value={2}>Fill in the gap</option>
            </select>
          </div>

          {Number(form.questionType) === 0 && (
            <>
              <div className="form-group">
                <label>Options</label>
                {form.options.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      value={opt}
                      placeholder={`Option ${idx + 1}`}
                      onChange={(e) => {
                        const next = [...form.options];
                        next[idx] = e.target.value;
                        // Follow the rename, so fixing a typo does not silently unset the answer.
                        const answer = form.correctAnswer === opt ? e.target.value : form.correctAnswer;
                        setForm({ ...form, options: next, correctAnswer: answer });
                      }}
                    />
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => setForm({
                          ...form,
                          options: form.options.filter((_, i) => i !== idx),
                          correctAnswer: form.correctAnswer === opt ? '' : form.correctAnswer
                        })}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => setForm({ ...form, options: [...form.options, ''] })}
                >
                  + Add option
                </button>
              </div>
              <div className="form-group">
                <label>Correct answer</label>
                <select value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} required>
                  <option value="">Select…</option>
                  {form.options.filter((o) => o.trim()).map((o, i) => <option key={i} value={o}>{o}</option>)}
                </select>
              </div>
            </>
          )}

          {Number(form.questionType) === 1 && (
            <div className="form-group">
              <label>Correct answer</label>
              <select value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} required>
                <option value="">Select…</option>
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            </div>
          )}

          {Number(form.questionType) === 2 && (
            <div className="form-group">
              <label>Correct answer</label>
              <input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} required placeholder="Processing" />
              <p className="card-sub" style={{ marginTop: 6 }}>
                Mark the gap in the question text with _______ . Capitalisation and surrounding spaces are ignored when marking.
              </p>
            </div>
          )}

          <div className="form-group">
            <label>Marks</label>
            <input type="number" min={1} value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
          </div>

          <button className="btn btn-primary">{editingId ? 'Save changes' : 'Add question'}</button>
          {editingId && (
            <button type="button" className="btn btn-outline" style={{ marginLeft: 8 }} onClick={resetForm}>Cancel</button>
          )}
        </form>
      </div>

      <div className="card">
        <h3 className="card-title">Question bank</h3>
        <div className="form-group">
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
            <option value="">All courses</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
        <table>
          <thead><tr><th>Question</th><th>Type</th><th>Marks</th><th></th></tr></thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} style={q.id === editingId ? { background: '#eef3fa' } : undefined}>
                <td style={{ maxWidth: 260 }}>{q.text}</td>
                <td>{typeLabels[q.questionType] ?? '—'}</td>
                <td>{q.marks}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-outline" onClick={() => startEdit(q)} style={{ padding: '4px 10px', fontSize: '0.75rem', marginRight: 6 }}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(q.id)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
