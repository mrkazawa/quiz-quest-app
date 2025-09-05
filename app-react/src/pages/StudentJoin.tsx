import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket.js";

interface PlayerInfo {
  id: string;
  name: string;
  studentId: string;
  score: number;
}

interface JoinedRoomData {
  roomId: string;
  questionId?: number;
  isActive: boolean;
  players: PlayerInfo[];
}

const StudentJoin = () => {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [roomId, setRoomId] = useState(urlRoomId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleJoinedRoom = (data: JoinedRoomData) => {
      console.log("Successfully joined room:", data);
      setIsLoading(false);

      // Store student info in localStorage for refresh scenarios
      // Store in both old format (studentInfo) and new format (studentSession) for compatibility
      localStorage.setItem(
        "studentInfo",
        JSON.stringify({
          playerName: playerName.trim(),
          studentId: studentId.trim(),
          roomId: data.roomId,
        })
      );

      localStorage.setItem(
        "studentSession",
        JSON.stringify({
          currentRoom: data.roomId,
          playerName: playerName.trim(),
          studentId: studentId.trim(),
          currentScore: 0,
          currentStreak: 0,
          hasAnswered: false,
          currentQuestionIndex: 0,
        })
      );

      // Navigate to student waiting room or quiz room based on quiz status
      if (data.isActive) {
        navigate(`/student/room/${data.roomId}/quiz`);
      } else {
        // Pass initial players data to waiting room
        navigate(`/student/room/${data.roomId}/waiting`, {
          state: { initialPlayers: data.players },
        });
      }
    };

    const handleJoinError = (message: string) => {
      console.error("Join error:", message);
      setError(message);
      setIsLoading(false);
    };

    socket.on("joined_room", handleJoinedRoom);
    socket.on("join_error", handleJoinError);

    return () => {
      socket.off("joined_room", handleJoinedRoom);
      socket.off("join_error", handleJoinError);
    };
  }, [socket, navigate, playerName, studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (!playerName.trim() || !studentId.trim() || !roomId.trim()) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (!socket) {
      setError("Connection not available. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    if (!socket.connected) {
      setError("Not connected to server. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    console.log("Attempting to join room:", {
      playerName: playerName.trim(),
      studentId: studentId.trim(),
      roomId: roomId.trim(),
    });

    // Emit join room event
    socket.emit("join_room", {
      roomId: roomId.trim(),
      playerName: playerName.trim(),
      studentId: studentId.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img
              src="/quiz-quest-logo-horizontal.png"
              alt="Quiz Quest"
              className="w-full max-w-sm mx-auto"
            />
          </Link>
        </div>

        <div className="bg-white rounded-lg p-6">
          <form id="joinForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                id="playerName"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                id="studentId"
                placeholder="Enter your student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                id="roomId"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
                disabled={isLoading}
                maxLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </form>

          <div className="mt-6">
            <button
              type="submit"
              form="joinForm"
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 text-lg font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Join Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentJoin;
