import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const TeacherDashboard = () => {
  const { isAuthenticated, teacherId, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/teacher/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/teacher/login');
  };

  if (!isAuthenticated) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="teacher-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Teacher Dashboard</h1>
        <div>
          <span className="me-3">Welcome, Teacher {teacherId}</span>
          <button className="btn btn-outline-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      
      <p>This will be the main teacher interface (Phase 1b)</p>
      
      {/* Placeholder content */}
      <div className="dashboard-sections">
        <section>
          <h2>Create New Quiz</h2>
          <p>Quiz creation functionality coming in next iteration...</p>
        </section>
        
        <section>
          <h2>Active Rooms</h2>
          <p>Active room management coming in next iteration...</p>
        </section>
        
        <section>
          <h2>Quiz History</h2>
          <p>Quiz history view coming in next iteration...</p>
        </section>
      </div>
    </div>
  );
};

export default TeacherDashboard;
