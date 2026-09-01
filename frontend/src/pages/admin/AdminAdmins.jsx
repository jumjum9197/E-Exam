import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext.jsx';

const emptyForm = { fullName: '', username: '', email: '', password: '' };

export default function AdminAdmins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Only the seeded "admin" account may add or remove administrators.
  const isSuperAdmin = user?.userName?.toLowerCase() === 'admin';

  const load = () =>
    api.get('/admins')
      .then((res) => setAdmins(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load administrators.'));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await api.post('/admins', form);
      setNotice(`${form.username} can now sign in as an administrator.`);
      setForm(emptyForm);
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(Array.isArray(errors) ? errors.join(' ') : (err.response?.data?.message || 'Could not add administrator.'));
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`Remove ${username} as an administrator? This deletes the account.`)) return;
    try {
      await api.delete(`/admins/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not remove administrator.');
    }
  };

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3 className="card-title">Add administrator</h3>
        {isSuperAdmin ? (
          <>
            <p className="card-sub">You are signed in as the super admin, so you can create other administrator accounts.</p>
            {error && <div className="error-banner">{error}</div>}
            {notice && <div className="credentials-hint">{notice}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Full name</label>
                <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <button className="btn btn-primary">Add administrator</button>
            </form>
          </>
        ) : (
          <p className="card-sub">
            Only the super admin account can add or remove administrators. You can view the list here.
          </p>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Administrators</h3>
        <table>
          <thead><tr><th>Full name</th><th>Username</th><th>Email</th><th></th></tr></thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>{a.fullName}</td>
                <td>
                  {a.userName}
                  {a.isSuperAdmin && <span className="badge badge-active" style={{ marginLeft: 6 }}>Super admin</span>}
                </td>
                <td>{a.email}</td>
                <td>
                  {isSuperAdmin && !a.isSuperAdmin && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => handleDelete(a.id, a.userName)}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
