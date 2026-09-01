import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ code: '', title: '', description: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/courses').then((res) => setCourses(res.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/courses', form);
      setForm({ code: '', title: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create course.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    try {
      await api.delete(`/courses/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete course.');
    }
  };

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3 className="card-title">Add course</h3>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Course code</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required placeholder="CIT101" />
          </div>
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn btn-primary">Add course</button>
        </form>
      </div>

      <div className="card">
        <h3 className="card-title">Courses</h3>
        <table>
          <thead><tr><th>Code</th><th>Title</th><th></th></tr></thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.title}</td>
                <td><button className="btn btn-danger" onClick={() => handleDelete(c.id)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
