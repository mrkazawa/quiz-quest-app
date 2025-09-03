import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../hooks/useSocket.js';

interface SimpleQuiz {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

const TeacherDashboard = () => {
  const { isAuthenticated, teacherId, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  
  const [quizzes, setQuizzes] = useState<SimpleQuiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [activeRooms, setActiveRooms] = useState<Array<{id: string, participants: number}>>([]);

  console.log('TeacherDashboard render - isAuthenticated:', isAuthenticated, 'teacherId:', teacherId);

  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching /api/quizzes...');
      const response = await fetch('/api/quizzes');
      console.log('Response received:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Quiz data:', data);
      setQuizzes(data);
      setError('');
    } catch (err) {
      console.error('Quiz loading error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('Dashboard useEffect - isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to home');
      navigate('/');
      return;
    }
    
    console.log('Loading quizzes...');
    loadQuizzes();
  }, [isAuthenticated, navigate, loadQuizzes]);

  // Socket event listeners for room creation
  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (data: { roomId: string, quizId: string }) => {
      console.log('Room created:', data);
      // Navigate to waiting room when room is created
      navigate(`/teacher/room/${data.roomId}/waiting`);
    };

    socket.on('room_created', handleRoomCreated);

    return () => {
      socket.off('room_created', handleRoomCreated);
    };
  }, [socket, navigate]);

  const createRoom = (quizId: string) => {
    if (!socket || !teacherId) {
      console.log('Socket or teacherId not available');
      alert('Socket connection not ready. Please refresh the page.');
      return;
    }

    if (!socket.connected) {
      console.log('Socket not connected');
      alert('Socket connection not ready. Please refresh the page.');
      return;
    }
    
    console.log('Creating room for quiz:', quizId, 'Socket connected:', socket.connected);
    socket.emit('create_room', { quizId, teacherId });
  };

  const handleLogout = () => {
    logout();
    navigate('/teacher/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Redirecting...</span>
          </div>
          <p className="mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-1">Teacher Dashboard</h1>
              <p className="text-muted mb-0">Welcome, Teacher {teacherId}</p>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center">
                <div className={`badge ${isConnected ? 'bg-success' : 'bg-danger'}`}>
                  <i className={`bi ${isConnected ? 'bi-wifi' : 'bi-wifi-off'} me-1`}></i>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              <button className="btn btn-outline-secondary" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row">
        {/* Quiz Selection */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title mb-0">
                <i className="bi bi-collection me-2"></i>
                Available Quizzes
              </h3>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={loadQuizzes}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
            <div className="card-body">
              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 mb-0">Loading quizzes...</p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {!loading && !error && quizzes.length === 0 && (
                <div className="alert alert-warning">
                  <i className="bi bi-info-circle me-2"></i>
                  No quizzes available
                </div>
              )}

              {!loading && !error && quizzes.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr className="table-light">
                        <th scope="col" style={{ width: '70%' }}>Quiz Details</th>
                        <th scope="col" style={{ width: '15%', textAlign: 'center' }}>Questions</th>
                        <th scope="col" style={{ width: '15%', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizzes.map((quiz) => (
                        <tr key={quiz.id} className="quiz-row">
                          <td>
                            <h5 className="mb-1 text-primary fw-bold">{quiz.name}</h5>
                            {quiz.description ? (
                              <p className="mb-0 text-secondary">{quiz.description}</p>
                            ) : (
                              <p className="mb-0 text-muted fst-italic">No description available</p>
                            )}
                          </td>
                          <td className="text-center align-middle">
                            <span className="badge bg-info fs-6">{quiz.questionCount}</span>
                          </td>
                          <td className="text-center align-middle">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => createRoom(quiz.id)}
                              disabled={!isConnected}
                              title={!isConnected ? 'Socket connection required' : 'Create a new quiz room'}
                            >
                              <i className="bi bi-play-circle me-1"></i>
                              Create Room
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Active Rooms */}
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-broadcast me-2"></i>
                Active Rooms
              </h4>
            </div>
            <div className="card-body">
              {/* Placeholder for active rooms - will implement in next iteration */}
              <p className="text-muted mb-0">No active rooms</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-lightning me-2"></i>
                Quick Actions
              </h4>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary">
                  <i className="bi bi-file-earmark-plus me-2"></i>
                  Upload New Quiz
                </button>
                <button className="btn btn-outline-info">
                  <i className="bi bi-clock-history me-2"></i>
                  View Quiz History
                </button>
                <button className="btn btn-outline-success">
                  <i className="bi bi-gear me-2"></i>
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
