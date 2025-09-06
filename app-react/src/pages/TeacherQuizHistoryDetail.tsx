import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Layout from "../components/Layout";

interface PlayerRanking {
  rank: number;
  playerName: string;
  studentId?: string;
  score: number;
}

interface QuizHistoryDetail {
  id: string;
  roomId: string;
  quizName: string;
  playerCount: number;
  dateCompleted: string;
  rankings: PlayerRanking[];
}

const TeacherQuizHistoryDetail = () => {
  const { isAuthenticated } = useAuth();
  const { roomId } = useParams<{ roomId: string }>();

  const [historyDetail, setHistoryDetail] = useState<QuizHistoryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistoryDetail = useCallback(async () => {
    if (!roomId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/quiz-history/${roomId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setHistoryDetail(data);
    } catch (err) {
      console.error("Error loading history detail:", err);
      setError(err instanceof Error ? err.message : "Failed to load history details");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (isAuthenticated && roomId) {
      loadHistoryDetail();
    }
  }, [isAuthenticated, roomId, loadHistoryDetail]);

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

  const downloadCSV = () => {
    if (!historyDetail) return;

    // Create CSV content
    const headers = ['Rank', 'Player Name', 'Student ID', 'Score'];
    const csvContent = [
      headers.join(','),
      ...historyDetail.rankings.map(player => [
        player.rank,
        `"${player.playerName}"`,
        player.studentId || 'N/A',
        player.score
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `quiz-results-${getDisplayRoomId(historyDetail.roomId)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
      title="Quiz Results Detail" 
      subtitle={historyDetail ? `Results for "${historyDetail.quizName}"` : "Loading quiz details..."}
      showLogout={true}
      showBack={true}
      backTo="/teacher/history"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading quiz details...</p>
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

            {!loading && !error && historyDetail && (
              <>
                {/* Quiz Information */}
                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-blue-700 mb-2">
                    {historyDetail.quizName}
                  </h4>
                  <div className="text-gray-600 space-y-1">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(historyDetail.dateCompleted)}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{historyDetail.playerCount} players</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>Room ID: {getDisplayRoomId(historyDetail.roomId)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Rankings */}
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Player Rankings</h4>
                  {historyDetail.rankings && historyDetail.rankings.length > 0 ? (
                    <>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Rank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Player
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Score
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {historyDetail.rankings.map((player, index) => (
                                <tr 
                                  key={index}
                                  className={`${
                                    player.rank === 1 ? 'bg-yellow-50' : 
                                    player.rank === 2 ? 'bg-gray-50' : 
                                    player.rank === 3 ? 'bg-orange-50' : ''
                                  }`}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {player.rank === 1 && (
                                        <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      )}
                                      <span className="text-lg font-bold text-gray-900">#{player.rank}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {player.playerName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        ID: {player.studentId || "N/A"}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className="text-lg font-semibold text-gray-900">
                                      {player.score}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Download Button - Bottom of Rankings */}
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={downloadCSV}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download CSV
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No results available for this quiz session.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherQuizHistoryDetail;
