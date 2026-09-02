import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/students')
      .then((res) => setStudents(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load students.'));
  }, []);

  const term = search.trim().toLowerCase();
  const visible = term
    ? students.filter((s) =>
        [s.fullName, s.userName, s.email, s.matricNumber]
          .some((field) => (field || '').toLowerCase().includes(term)))
    : students;

  return (
    <div className="card">
      <h3 className="card-title">Registered students</h3>
      <p className="card-sub">{students.length} student{students.length === 1 ? '' : 's'} registered.</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="form-group">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, email or matric number…"
        />
      </div>

      <table>
        <thead>
          <tr><th>Full name</th><th>Matric number</th><th>Username</th><th>Email</th><th>Exams taken</th></tr>
        </thead>
        <tbody>
          {visible.map((s) => (
            <tr key={s.id}>
              <td>{s.fullName}</td>
              <td>{s.matricNumber || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
              <td>{s.userName}</td>
              <td>{s.email}</td>
              <td>{s.examsTaken}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {visible.length === 0 && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {students.length === 0 ? 'No students have registered yet.' : 'No student matches that search.'}
        </p>
      )}
    </div>
  );
}
