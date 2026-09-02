import { useState } from 'react';
import AdminCourses from './AdminCourses.jsx';
import AdminQuestions from './AdminQuestions.jsx';
import AdminExams from './AdminExams.jsx';
import AdminResults from './AdminResults.jsx';
import AdminStudents from './AdminStudents.jsx';
import AdminAdmins from './AdminAdmins.jsx';

const TABS = [
  { key: 'exams', label: 'Exam Scheduling' },
  { key: 'questions', label: 'Question Bank' },
  { key: 'courses', label: 'Courses' },
  { key: 'students', label: 'Students' },
  { key: 'results', label: 'Results' },
  { key: 'admins', label: 'Administrators' }
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('exams');

  return (
    <div className="container">
      <h2>Administrator Dashboard</h2>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'exams' && <AdminExams />}
      {tab === 'questions' && <AdminQuestions />}
      {tab === 'courses' && <AdminCourses />}
      {tab === 'students' && <AdminStudents />}
      {tab === 'results' && <AdminResults />}
      {tab === 'admins' && <AdminAdmins />}
    </div>
  );
}
