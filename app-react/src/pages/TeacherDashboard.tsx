import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useSocket } from "../hooks/useSocket.js";
import Layout from "../components/Layout";

interface SimpleQuiz {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

const TeacherDashboard = () => {
  const { isAuthenticated, teacherId } = useAuth();
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

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title="Teacher Dashboard" 
      subtitle="Ready to create a new quiz session?"
      showLogout={true}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Quiz Selection */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <h3 className="text-xl font-bold text-white flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Available Quizzes
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate("/teacher/create-quiz")}
                  className="bg-white text-primary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                  title="Create New Quiz"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden lg:inline">Create</span>
                </button>
                <button
                  onClick={() => {
                    /* TODO: Implement quiz history */
                  }}
                  className="bg-white text-primary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                  title="View Quiz History"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden lg:inline">History</span>
                </button>
                <button
                  onClick={loadQuizzes}
                  disabled={loading}
                  className="bg-white text-primary-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh Quiz List"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden lg:inline">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading quizzes...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
            )}

            {!loading && !error && quizzes.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No quizzes available
              </div>
            )}

            {!loading && !error && quizzes.length > 0 && (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <h5 className="text-lg font-semibold text-primary-700 mb-1">
                          {quiz.name}
                        </h5>
                        {quiz.description ? (
                          <p className="text-gray-600 text-sm mb-2">{quiz.description}</p>
                        ) : (
                          <p className="text-gray-400 text-sm italic mb-2">No description available</p>
                        )}
                        <div className="flex items-center space-x-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {quiz.questionCount} questions
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => createRoom(quiz.id)}
                          disabled={!isConnected}
                          title={!isConnected ? "Connection required" : "Start new quiz session"}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 min-w-20"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z" />
                          </svg>
                          <span className="hidden lg:inline">START</span>
                        </button>
                        <button
                          onClick={() => deleteQuiz(quiz.id, quiz.name)}
                          title="Delete quiz"
                          className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 min-w-20"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden lg:inline">DELETE</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          onClick={handleDeleteCancel}
        >
          <div className="bg-white rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-600 text-white rounded-t-lg px-6 py-4 flex items-center justify-between">
              <h5 className="text-lg font-semibold flex items-center mb-0">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Confirm Deletion
              </h5>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors"
                onClick={handleDeleteCancel}
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h6 className="text-lg font-medium mb-4">Are you sure you want to delete this quiz?</h6>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-1">Quiz Title:</div>
                  <div className="text-primary-700 font-semibold">{deleteModal.quiz?.name}</div>
                </div>
                <p className="text-gray-500 text-sm mb-0">
                  This action cannot be undone. All quiz data will be permanently removed.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-center">
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                onClick={handleDeleteConfirm}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
