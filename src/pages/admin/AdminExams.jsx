import { useEffect, useState } from 'react';
import api from '../../services/api';

const typeLabels = { 0: 'MCQ', 1: 'T/F', 2: 'Gap' };

function toLocalInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const inAWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [form, setForm] = useState({
    title: '',
    courseId: '',
    startTime: toLocalInputValue(now),
    endTime: toLocalInputValue(inAWeek),
    durationMinutes: 30,
    isActive: true,
    randomizeQuestions: false,
    questionsToShow: '',
    // When false, every question on the course goes into the exam.
    chooseQuestions: false,
    questionIds: []
  });

  const loadExams = () => api.get('/exams').then((res) => setExams(res.data));
  const loadCourses = () => api.get('/courses').then((res) => setCourses(res.data));

  useEffect(() => { loadExams(); loadCourses(); }, []);

  useEffect(() => {
    if (!form.courseId) { setQuestions([]); return; }
    api.get('/questions', { params: { courseId: form.courseId } }).then((res) => {
      setQuestions(res.data);
      // Unless the admin is hand-picking, the exam covers the whole course bank.
      setForm((f) => (f.chooseQuestions ? f : { ...f, questionIds: res.data.map((q) => q.id) }));
    });
  }, [form.courseId]);

  const toggleQuestion = (id) => {
    setForm((f) => ({
      ...f,
      questionIds: f.questionIds.includes(id) ? f.questionIds.filter((x) => x !== id) : [...f.questionIds, id]
    }));
  };

  const toggleChooseQuestions = (checked) => {
    // Turning it off hands the whole course bank back; turning it on opens the picker
    // with everything already ticked, so the admin only has to untick what to leave out.
    setForm((f) => ({ ...f, chooseQuestions: checked, questionIds: questions.map((q) => q.id) }));
    setPickerOpen(checked);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/exams', {
        title: form.title,
        courseId: Number(form.courseId),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        isActive: form.isActive,
        randomizeQuestions: form.randomizeQuestions,
        // Blank means "show every question selected".
        questionsToShow: Number(form.questionsToShow) || 0,
        questionIds: form.questionIds
      });
      // Keep the course selected for the next exam, so restore its full bank unless hand-picking.
      setForm({
        ...form,
        title: '',
        questionsToShow: '',
        questionIds: form.chooseQuestions ? [] : questions.map((q) => q.id)
      });
      loadExams();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not schedule exam.');
    }
  };

  const toggleActive = async (id) => {
    await api.patch(`/exams/${id}/toggle-active`);
    loadExams();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      loadExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete exam.');
    }
  };

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3 className="card-title">Schedule exam</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Course</label>
            <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value, questionIds: [] })} required>
              <option value="">Select course…</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
            </select>
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Start time</label>
              <input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>End time</label>
              <input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: 'auto', marginRight: 8 }} />
              Visible to students (active)
            </label>
          </div>

          {form.courseId && (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.chooseQuestions}
                  onChange={(e) => toggleChooseQuestions(e.target.checked)}
                  style={{ width: 'auto', marginRight: 8 }}
                />
                Do you want to select the questions that will come out for students?
              </label>
              {form.chooseQuestions ? (
                <p className="card-sub" style={{ marginTop: 6 }}>
                  {form.questionIds.length} of {questions.length} question{questions.length === 1 ? '' : 's'} picked.
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', marginLeft: 8 }}
                    onClick={() => setPickerOpen(true)}
                  >
                    Choose questions
                  </button>
                </p>
              ) : (
                <p className="card-sub" style={{ marginTop: 6 }}>
                  All {questions.length} question{questions.length === 1 ? '' : 's'} on this course will be used.
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label>
              <input type="checkbox" checked={form.randomizeQuestions} onChange={(e) => setForm({ ...form, randomizeQuestions: e.target.checked })} style={{ width: 'auto', marginRight: 8 }} />
              Randomise question order for each student
            </label>
          </div>

          <div className="form-group">
            <label>Questions each student sees</label>
            <input
              type="number"
              min={1}
              max={form.questionIds.length || undefined}
              value={form.questionsToShow}
              onChange={(e) => setForm({ ...form, questionsToShow: e.target.value })}
              placeholder={form.questionIds.length ? `All ${form.questionIds.length}` : 'All selected questions'}
            />
            <p className="card-sub" style={{ marginTop: 6 }}>
              Leave blank to serve every question you selected. Enter a smaller number to draw
              that many out of the {form.questionIds.length} selected — tick randomise as well and
              each student gets a different paper.
            </p>
          </div>

          <button className="btn btn-primary">Schedule exam</button>
        </form>

        {pickerOpen && (
          <div className="modal-backdrop" onClick={() => setPickerOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="card-title">Choose questions</h3>
                  <p className="card-sub" style={{ margin: 0 }}>
                    {form.questionIds.length} of {questions.length} selected. Only ticked questions go into this exam.
                  </p>
                </div>
                <button type="button" className="modal-close" aria-label="Close" onClick={() => setPickerOpen(false)}>×</button>
              </div>

              <div className="modal-body">
                {questions.length === 0 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No questions yet for this course — add some in the Question Bank tab.
                  </p>
                )}
                {questions.map((q) => (
                  <label key={q.id} className="modal-option">
                    <input type="checkbox" checked={form.questionIds.includes(q.id)} onChange={() => toggleQuestion(q.id)} />
                    <span>
                      {q.text}
                      <span style={{ color: 'var(--text-muted)' }}> ({typeLabels[q.questionType] ?? '—'} · {q.marks} mk)</span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setForm({ ...form, questionIds: questions.map((q) => q.id) })}>Select all</button>
                <button type="button" className="btn btn-outline" onClick={() => setForm({ ...form, questionIds: [] })}>Clear</button>
                <button type="button" className="btn btn-primary" onClick={() => setPickerOpen(false)}>Done</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Scheduled exams</h3>
        <table>
          <thead><tr><th>Title</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {exams.map((e) => (
              <tr key={e.id}>
                <td>{e.title}<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {e.courseCode} · shows {e.questionsToShow} of {e.questionCount} Qs · {e.totalMarks} marks{e.randomizeQuestions ? ' · shuffled' : ''}
                </span></td>
                <td>{e.isActive ? <span className="badge badge-active">Active</span> : <span className="badge badge-inactive">Inactive</span>}</td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem', marginRight: 6 }} onClick={() => toggleActive(e.id)}>
                    {e.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleDelete(e.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
