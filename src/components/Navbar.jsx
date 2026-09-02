import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="brand">NOUN <span>e-Exam</span> System</div>
      <div className="navbar-links">
        {user ? (
          <>
            <span>{user.fullName} ({user.role})</span>
            {user.role === 'Admin' ? (
              <Link to="/admin">Dashboard</Link>
            ) : (
              <Link to="/">Dashboard</Link>
            )}
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
