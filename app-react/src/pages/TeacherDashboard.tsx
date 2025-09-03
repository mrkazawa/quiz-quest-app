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
    console.log('Dashboard loaded - teacherId:', teacherId);
    loadQuizzes();
  }, [loadQuizzes, teacherId]);

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

  const deleteQuiz = (quizId: string, quizName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${quizName}"? This action cannot be undone.`);
    if (confirmed) {
      // TODO: Implement actual delete functionality
      console.log('Delete quiz:', quizId);
      alert('Delete functionality will be implemented in a future update.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }}>
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="mb-1">Teacher Dashboard</h1>
            <p className="text-muted mb-0">Welcome! Ready to create a new quiz session?</p>
          </div>
          <div>
            <button className="btn btn-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-md-inline ms-2">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Selection */}
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="card-title mb-0">
            <i className="bi bi-collection me-2"></i>
            Available Quizzes
          </h3>
          <div className="btn-group" role="group">
            <button 
              className="btn btn-success btn-sm"
              onClick={() => {/* TODO: Implement create quiz */}}
              title="Create New Quiz"
            >
              <i className="bi bi-plus-circle"></i>
              <span className="d-none d-lg-inline ms-1">Create Quiz</span>
            </button>
            <button 
              className="btn btn-info btn-sm"
              onClick={() => {/* TODO: Implement quiz history */}}
              title="View Quiz History"
            >
              <i className="bi bi-clock-history"></i>
              <span className="d-none d-lg-inline ms-1">History</span>
            </button>
            <button 
              className="btn btn-light btn-sm border"
              onClick={loadQuizzes}
              disabled={loading}
              title="Refresh Quiz List"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span className="d-none d-lg-inline ms-1">Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="card-body p-0">
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 mb-0">Loading quizzes...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger m-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {!loading && !error && quizzes.length === 0 && (
            <div className="alert alert-warning m-3">
              <i className="bi bi-info-circle me-2"></i>
              No quizzes available
            </div>
          )}

          {!loading && !error && quizzes.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr className="table-light">
                    <th scope="col" className="quiz-details-col">Quiz Details</th>
                    <th scope="col" className="questions-col text-center">Questions</th>
                    <th scope="col" className="actions-col text-center">Actions</th>
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
                      <td className="align-middle actions-col p-0">
                        <div className="d-flex justify-content-end gap-2 flex-md-row flex-column pe-2">
                          <button
                            className="btn btn-success start-quiz-btn"
                            onClick={() => createRoom(quiz.id)}
                            disabled={!isConnected}
                            title={!isConnected ? 'Connection required' : 'Start new quiz session'}
                            style={{ minWidth: '80px' }}
                          >
                            <i className="bi bi-play-circle"></i>
                            {/* Three lines for extra large screens */}
                            <span className="d-none d-xl-block mt-1">
                              <div>START</div>
                              <div>QUIZ</div>
                            </span>
                            {/* Two lines for large and medium screens */}
                            <span className="d-none d-lg-block d-xl-none mt-1">
                              <div>START</div>
                              <div>QUIZ</div>
                            </span>
                            {/* Icon only for small screens - already handled by default */}
                          </button>
                          <button
                            className="btn btn-danger delete-quiz-btn"
                            onClick={() => deleteQuiz(quiz.id, quiz.name)}
                            title="Delete quiz"
                            style={{ minWidth: '80px' }}
                          >
                            <i className="bi bi-trash"></i>
                            {/* Three lines for extra large screens */}
                            <span className="d-none d-xl-block mt-1">
                              <div>DELETE</div>
                              <div>QUIZ</div>
                            </span>
                            {/* Two lines for large and medium screens */}
                            <span className="d-none d-lg-block d-xl-none mt-1">
                              <div>DELETE</div>
                              <div>QUIZ</div>
                            </span>
                            {/* Icon only for small screens */}
                          </button>
                        </div>
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
  );
};

export default TeacherDashboard;
