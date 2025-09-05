import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useSocket } from "../hooks/useSocket.js";

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
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    quiz: { id: string; name: string } | null;
  }>({ show: false, quiz: null });
  // const [activeRooms, setActiveRooms] = useState<Array<{id: string, participants: number}>>([]);

  console.log(
    "TeacherDashboard render - isAuthenticated:",
    isAuthenticated,
    "teacherId:",
    teacherId
  );

  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching /api/quizzes...");
      const response = await fetch("/api/quizzes");
      console.log("Response received:", response.status, response.ok);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Quiz data:", data);
      setQuizzes(data);
      setError("");
    } catch (err) {
      console.error("Quiz loading error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("Dashboard loaded - teacherId:", teacherId);
    loadQuizzes();
  }, [loadQuizzes, teacherId]);

  // Socket event listeners for room creation
  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (data: { roomId: string; quizId: string }) => {
      console.log("Room created:", data);
      // Navigate to waiting room when room is created
      navigate(`/teacher/room/${data.roomId}/waiting`);
    };

    socket.on("room_created", handleRoomCreated);

    return () => {
      socket.off("room_created", handleRoomCreated);
    };
  }, [socket, navigate]);

  const createRoom = (quizId: string) => {
    if (!socket || !teacherId) {
      console.log("Socket or teacherId not available");
      alert("Socket connection not ready. Please refresh the page.");
      return;
    }

    if (!socket.connected) {
      console.log("Socket not connected");
      alert("Socket connection not ready. Please refresh the page.");
      return;
    }

    console.log(
      "Creating room for quiz:",
      quizId,
      "Socket connected:",
      socket.connected
    );
    socket.emit("create_room", { quizId, teacherId });
  };

  const deleteQuiz = (quizId: string, quizName: string) => {
    setDeleteModal({
      show: true,
      quiz: { id: quizId, name: quizName }
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.quiz) return;

    try {
      const response = await fetch(`/api/quiz/${deleteModal.quiz.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove quiz from local state
        setQuizzes(prev => prev.filter(quiz => quiz.id !== deleteModal.quiz!.id));
        // Close modal
        setDeleteModal({ show: false, quiz: null });
        console.log(`Quiz "${deleteModal.quiz.name}" deleted successfully`);
      } else {
        // Handle API error
        console.error('Failed to delete quiz:', result.error);
        alert(`Failed to delete quiz: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Error deleting quiz. Please check your connection and try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, quiz: null });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
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
    <div
      style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 1.5rem" }}
    >
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="mb-1">Teacher Dashboard</h1>
            <p className="text-muted mb-0">
              Welcome! Ready to create a new quiz session?
            </p>
          </div>
          <div>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogout}
            >
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
              className="btn btn-light btn-sm border dashboard-action-btn"
              onClick={() => navigate("/teacher/create-quiz")}
              title="Create New Quiz"
            >
              <i className="bi bi-plus-circle"></i>
              <span className="d-none d-lg-inline ms-1">Create</span>
            </button>
            <button
              className="btn btn-light btn-sm border dashboard-action-btn"
              onClick={() => {
                /* TODO: Implement quiz history */
              }}
              title="View Quiz History"
            >
              <i className="bi bi-clock-history"></i>
              <span className="d-none d-lg-inline ms-1">History</span>
            </button>
            <button
              className="btn btn-light btn-sm border dashboard-action-btn"
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
            <div className="alert alert-danger table-alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {!loading && !error && quizzes.length === 0 && (
            <div className="alert alert-warning table-alert">
              <i className="bi bi-info-circle me-2"></i>
              No quizzes available
            </div>
          )}

          {!loading && !error && quizzes.length > 0 && (
            <div className="table-responsive">
              <table className="table mb-0">
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr
                      key={quiz.id}
                      className="quiz-row border-top border-bottom"
                    >
                      <td className="py-3">
                        <h5 className="mb-1 text-primary fw-bold">
                          {quiz.name}
                        </h5>
                        {quiz.description ? (
                          <p className="mb-0 text-secondary">
                            {quiz.description}
                          </p>
                        ) : (
                          <p className="mb-0 text-muted fst-italic">
                            No description available
                          </p>
                        )}
                      </td>
                      <td className="text-center align-middle py-3">
                        <div className="d-flex flex-column align-items-center justify-content-center d-lg-none">
                          <span className="badge bg-info fs-6 mb-1">
                            {quiz.questionCount}
                          </span>
                          <small className="text-muted">questions</small>
                        </div>
                        <div className="d-none d-lg-flex align-items-center justify-content-center">
                          <span className="badge bg-info fs-6 me-2">
                            {quiz.questionCount}
                          </span>
                          <small className="text-muted">questions</small>
                        </div>
                      </td>
                      <td className="align-middle actions-col p-0 py-3">
                        <div className="d-flex justify-content-end gap-2 flex-md-row flex-column pe-2">
                          <button
                            className="btn btn-success start-quiz-btn"
                            onClick={() => createRoom(quiz.id)}
                            disabled={!isConnected}
                            title={
                              !isConnected
                                ? "Connection required"
                                : "Start new quiz session"
                            }
                            style={{ minWidth: "80px" }}
                          >
                            <i className="bi bi-play-circle"></i>
                            {/* Text for large screens and up */}
                            <span className="d-none d-lg-block mt-1">
                              <div>START</div>
                            </span>
                            {/* Icon only for small screens - already handled by default */}
                          </button>
                          <button
                            className="btn btn-outline-danger delete-quiz-btn"
                            onClick={() => deleteQuiz(quiz.id, quiz.name)}
                            title="Delete quiz"
                            style={{ minWidth: "80px" }}
                          >
                            <i className="bi bi-trash"></i>
                            {/* Text for large screens and up */}
                            <span className="d-none d-lg-block mt-1">
                              <div>DELETE</div>
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

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={handleDeleteCancel}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-danger text-white border-0 pb-3">
                <h5 className="modal-title d-flex align-items-center mb-0">
                  <i className="bi bi-exclamation-triangle-fill me-2" style={{ fontSize: '1.5rem' }}></i>
                  Confirm Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleDeleteCancel}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body py-4">
                <div className="text-center">
                  <div className="mb-3">
                    <i className="bi bi-trash text-danger" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h6 className="mb-3">Are you sure you want to delete this quiz?</h6>
                  <div className="bg-light rounded p-3 mb-3">
                    <div className="fw-bold text-muted mb-1">Quiz Title:</div>
                    <div className="text-primary fw-bold">{deleteModal.quiz?.name}</div>
                  </div>
                  <p className="text-muted mb-0">
                    <small>This action cannot be undone. All quiz data will be permanently removed.</small>
                  </p>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 justify-content-center">
                <button
                  type="button"
                  className="btn btn-danger btn-lg px-4"
                  onClick={handleDeleteConfirm}
                >
                  <i className="bi bi-trash me-2"></i>
                  Delete Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
