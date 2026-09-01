import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', matricNumber: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(Array.isArray(errors) ? errors.join(' ') : (err.response?.data?.message || 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Create an account</h2>
      {error && <div className="error-banner">{error}</div>}
      {success && <div className="credentials-hint">Registered successfully. Redirecting to login…</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full name</label>
          <input value={form.fullName} onChange={update('fullName')} required />
        </div>
        <div className="form-group">
          <label>Username</label>
          <input value={form.username} onChange={update('username')} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={update('email')} required />
        </div>
        <div className="form-group">
          <label>Matric number</label>
          <input value={form.matricNumber} onChange={update('matricNumber')} placeholder="NOU..." />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={form.password} onChange={update('password')} required minLength={6} />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <div className="credentials-hint">
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
}
