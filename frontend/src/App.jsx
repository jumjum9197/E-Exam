import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import ExamInterface from './pages/ExamInterface.jsx';
import ResultPage from './pages/ResultPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={
          <ProtectedRoute role="Student"><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/exam/:examId" element={
          <ProtectedRoute role="Student"><ExamInterface /></ProtectedRoute>
        } />
        <Route path="/results/:resultId" element={
          <ProtectedRoute><ResultPage /></ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}
