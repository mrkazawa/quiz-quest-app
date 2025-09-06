import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Layout from "../components/Layout";

interface QuizHistoryItem {
  id: string;
  roomId: string;
  quizName: string;
  playerCount: number;
  dateCompleted: string;
}

const TeacherQuizHistory = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [historyItems, setHistoryItems] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuizHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/quiz-history");
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You need to be logged in as a teacher to view quiz history");
        }
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setHistoryItems(data);
    } catch (err) {
      console.error("Error loading quiz history:", err);
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadQuizHistory();
    }
  }, [isAuthenticated]);

  const viewHistoryDetail = (roomId: string) => {
    navigate(`/teacher/history/${roomId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const time = date.toLocaleTimeString();
    return `${month} ${day}, ${year} ${time}`;
  };

  const getDisplayRoomId = (roomId: string) => {
    return roomId.replace(/^room_/, "");
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
      title="Quiz History List" 
      subtitle="View detailed results from your past quiz sessions"
      showLogout={true}
      showBack={true}
      backTo="/teacher/dashboard"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading quiz history...</p>
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

            {!loading && !error && historyItems.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                No quiz history available
              </div>
            )}

            {!loading && !error && historyItems.length > 0 && (
              <div className="space-y-4">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex"
                  >
                    <div 
                      className="flex-1 p-4 cursor-pointer"
                      onClick={() => viewHistoryDetail(item.roomId)}
                    >
                      <div className="space-y-2">
                        {/* Quiz Title */}
                        <h5 className="text-lg font-semibold text-blue-700">
                          {item.quizName}
                        </h5>
                        
                        {/* Metadata - All on one line */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="font-medium">Room ID:</span>
                            <span className="ml-1">{getDisplayRoomId(item.roomId)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Completed:</span>
                            <span className="ml-1">{formatDate(item.dateCompleted)}</span>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.playerCount} players
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewHistoryDetail(item.roomId);
                      }}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-600 px-6 rounded-r-lg font-medium transition-colors duration-200 flex items-center justify-center min-w-16"
                      title="View Results"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherQuizHistory;
