import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../hooks/useAuth.js';
import Layout from '../components/Layout';

interface StudentInfo {
  socketId: string;
  studentId: string;
  name: string;
  joinedAt: number;
}

const TeacherWaitingRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { socket } = useSocket();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [roomInfo, setRoomInfo] = useState<{quizName: string, roomId: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('TeacherWaitingRoom render:', { roomId, socket: !!socket, isAuthenticated, loading });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/teacher/login');
      return;
    }

    if (!socket || !roomId) {
      console.log('Missing socket or roomId:', { socket: !!socket, roomId });
      return; // Don't set error immediately, wait for socket to be available
    }

    // Function to request room info when socket is ready
    const requestRoomInfo = () => {
      console.log('TeacherWaitingRoom requesting room info for:', roomId);
      socket.emit('get_room_info', { roomId });
    };

    if (!socket.connected) {
      console.log('Socket not connected, waiting for connection...');
      
      // Wait for socket to connect, then request room info
      const handleConnect = () => {
        console.log('Socket connected, requesting room info');
        requestRoomInfo();
      };

      socket.on('connect', handleConnect);
      
      // Set a reasonable timeout for connection
      const connectionTimeout = setTimeout(() => {
        if (!socket.connected) {
          console.error('Socket connection timeout');
          setError('Could not connect to server. Please refresh the page.');
          setLoading(false);
        }
      }, 10000);

      return () => {
        socket.off('connect', handleConnect);
        clearTimeout(connectionTimeout);
      };
    } else {
      // Socket is already connected, request room info immediately
      requestRoomInfo();
    }

    // Socket event listeners (always register these)
    const handleRoomInfo = (data: { roomId: string; quizName: string; students: StudentInfo[] }) => {
      console.log('Received room_info:', data);
      setRoomInfo(data);
      setStudents(data.students);
      setLoading(false);
    };

    const handlePlayerJoined = (data: { playerId: string; playerName: string; studentId: string; players: Array<{ id: string; name: string; studentId: string; score: number }> }) => {
      console.log('Player joined:', data);
      // Convert players to StudentInfo format
      const studentList = data.players.map(player => ({
        socketId: player.id,
        studentId: player.studentId,
        name: player.name,
        joinedAt: Date.now()
      }));
      setStudents(studentList);
    };

    const handlePlayerLeft = (data: { playerId: string; players: Array<{ id: string; name: string; studentId: string; score: number }> }) => {
      console.log('Player left:', data);
      // Convert players to StudentInfo format
      const studentList = data.players.map(player => ({
        socketId: player.id,
        studentId: player.studentId,
        name: player.name,
        joinedAt: Date.now()
      }));
      setStudents(studentList);
    };

    const handleRoomDeleted = () => {
      console.log('Room deleted, navigating to dashboard');
      navigate('/teacher/dashboard');
    };

    const handleRoomError = (message: string) => {
      console.error('Room error from server:', message);
      if (message.includes('Room not found') || message.includes('Room does not exist')) {
        // Room doesn't exist - redirect to dashboard
        navigate('/teacher/dashboard');
        return;
      }
      setError('This room no longer exists. Please create a new room from the dashboard.');
      setLoading(false);
    };

    const handleQuizStarted = (data: { roomId: string }) => {
      console.log('Quiz started:', data);
      // Don't navigate yet - wait for new_question event to get the first question
    };

    const handleNewQuestion = (data: { questionId: number; question: string; options: string[]; timeLimit: number }) => {
      console.log('First question received, navigating to quiz room:', data);
      // Navigate to the first question
      navigate(`/teacher/room/${roomId}/question/${data.questionId}`);
    };

    socket.on('room_info', handleRoomInfo);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('room_deleted', handleRoomDeleted);
    socket.on('room_error', handleRoomError);
    socket.on('quiz_started', handleQuizStarted);
    socket.on('new_question', handleNewQuestion);

    return () => {
      socket.off('room_info', handleRoomInfo);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('room_deleted', handleRoomDeleted);
      socket.off('room_error', handleRoomError);
      socket.off('quiz_started', handleQuizStarted);
      socket.off('new_question', handleNewQuestion);
    };
  }, [socket, roomId, navigate, isAuthenticated]);

  const startQuiz = () => {
    if (!socket || !roomId) return;
    socket.emit('start_quiz', { roomId });
  };

  const deleteRoom = () => {
    if (!socket || !roomId) return;
    if (confirm('Are you sure you want to delete this room?')) {
      socket.emit('delete_room', { roomId });
    }
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      // Could add a toast notification here
    }
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}/student/join/${roomId}`;
    navigator.clipboard.writeText(url);
    // Could add a toast notification here
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">
            {!socket ? 'Initializing connection...' : 
             !socket.connected ? 'Connecting to server...' : 
             'Loading room information...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <i className="bi bi-exclamation-triangle mr-2"></i>
            <span>{error}</span>
            <button 
              className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              onClick={() => navigate('/teacher/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!roomInfo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <i className="bi bi-info-circle mr-2"></i>
            <span>Room not found or no longer exists.</span>
            <button 
              className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              onClick={() => navigate('/teacher/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title={`Waiting Room - ${roomInfo.quizName}`}
      subtitle={`Room ID: ${roomId} • Waiting for students to join`}
      showLogout={true} 
      showBack={true} 
      backTo="/teacher/dashboard"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Room Info & Controls */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg px-6 py-4">
                <h4 className="text-xl font-semibold mb-0 flex items-center">
                  <i className="bi bi-door-open mr-2"></i>
                  Room Details
                </h4>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room ID</label>
                  <div className="flex">
                    <input 
                      type="text" 
                      className="flex-1 px-3 py-2 text-2xl font-bold text-center border border-gray-300 rounded-l-lg bg-gray-50 text-gray-800 focus:outline-none" 
                      value={roomId} 
                      readOnly 
                    />
                    <button 
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg transition-colors duration-200 text-gray-600"
                      onClick={copyRoomId}
                      title="Copy Room ID"
                    >
                      <i className="bi bi-clipboard text-lg"></i>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Join URL</label>
                  <div className="flex">
                    <input 
                      type="text" 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-800 text-sm focus:outline-none" 
                      value={`${window.location.origin}/student/join/${roomId}`}
                      readOnly 
                    />
                    <button 
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-l-0 border-gray-300 rounded-r-lg transition-colors duration-200 text-gray-600"
                      onClick={copyRoomLink}
                      title="Copy Join URL"
                    >
                      <i className="bi bi-clipboard text-lg"></i>
                    </button>
                  </div>
                </div>

                <div className="mb-6 text-center">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">QR Code</label>
                  <div className="border border-gray-200 rounded-lg p-4 bg-white inline-block">
                    <QRCodeSVG 
                      value={`${window.location.origin}/student/join/${roomId}`}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Students can scan this QR code to join</p>
                </div>

                <div className="space-y-3">
                  <button 
                    className={`w-full px-4 py-3 rounded-lg font-semibold text-white transition-colors duration-200 flex items-center justify-center ${
                      students.length === 0 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    onClick={startQuiz}
                    disabled={students.length === 0}
                  >
                    <i className="bi bi-play-circle mr-2"></i>
                    Start Quiz ({students.length} students)
                  </button>
                  <button 
                    className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-300 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                    onClick={deleteRoom}
                  >
                    <i className="bi bi-trash mr-2"></i>
                    Delete Room
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg px-6 py-4">
                <h4 className="text-xl font-semibold mb-0 flex items-center">
                  <i className="bi bi-people mr-2"></i>
                  Joined Students ({students.length})
                </h4>
              </div>
              <div className="p-6">
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="bi bi-people text-6xl text-gray-300 mb-4 block"></i>
                    <h5 className="text-xl text-gray-500 mb-2">Waiting for students to join...</h5>
                    <p className="text-gray-400">Share the Room ID or URL with your students</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 justify-center">
                    {students.map((student) => (
                      <span 
                        key={student.socketId}
                        className="inline-block bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium text-sm"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {student.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherWaitingRoom;
