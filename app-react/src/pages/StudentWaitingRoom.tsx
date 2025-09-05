import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';
import Layout from '../components/Layout';

interface PlayerInfo {
  id: string;
  name: string;
  studentId: string;
  score: number;
}

const StudentWaitingRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  // Get initial players from navigation state if available
  const initialPlayers = location.state?.initialPlayers || [];
  const [players, setPlayers] = useState<PlayerInfo[]>(initialPlayers);
  const [loading, setLoading] = useState(true);
  const [quizName] = useState('');
  const [error, setError] = useState<string | null>(null);

  console.log('StudentWaitingRoom render:', { roomId, socket: !!socket, loading });

  useEffect(() => {
    // Wait for both socket and roomId to be available
    if (!socket || !roomId) {
      console.log('Waiting for socket and roomId:', { socket: !!socket, roomId });
      return;
    }

    // Function to validate room exists and rejoin if needed
    const validateRoomAndRejoin = () => {
      console.log('Validating room exists:', roomId);
      
      // Try to get stored student info for rejoin
      const storedInfo = localStorage.getItem('studentInfo');
      if (storedInfo) {
        try {
          const { playerName, studentId: storedStudentId, roomId: storedRoomId } = JSON.parse(storedInfo);
          if (storedRoomId === roomId) {
            console.log('Attempting to rejoin room with stored info:', { playerName, studentId: storedStudentId });
            // Rejoin the room
            socket.emit('join_room', {
              roomId,
              playerName,
              studentId: storedStudentId
            });
            return;
          }
        } catch (e) {
          console.warn('Failed to parse stored student info:', e);
        }
      }
      
      // Fallback: just validate room exists
      socket.emit('get_room_info', { roomId });
    };

    // Function to handle socket events when connected
    const setupEventListeners = () => {
      // Handle room info response (for when we request current room state)
      const handleRoomInfo = (data: { roomId: string; quizName: string; students: Array<{ socketId: string; name: string; studentId: string }> }) => {
        console.log('Room info received:', data);
        // Convert students to players format
        const playerList = data.students.map(student => ({
          id: student.socketId,
          name: student.name,
          studentId: student.studentId,
          score: 0
        }));
        setPlayers(playerList);
        setLoading(false);
      };

      // Handle room validation errors (room doesn't exist, expired, etc.)
      const handleRoomError = (message: string) => {
        console.error('Room error:', message);
        localStorage.removeItem('studentInfo');
        alert(`Room Error: ${message}`);
        navigate('/student/join');
      };

      // Handle initial room join confirmation with player list
      const handleJoinedRoom = (data: { roomId: string; questionId?: number; isActive: boolean; players: PlayerInfo[] }) => {
        console.log('Joined room confirmed:', data);
        setPlayers(data.players);
        setLoading(false);
      };

      // Handle other players joining
      const handlePlayerJoined = (data: { playerId: string; playerName: string; studentId: string; players: PlayerInfo[] }) => {
        console.log('Player joined:', data);
        setPlayers(data.players);
        setLoading(false);
      };

      // Handle players leaving
      const handlePlayerLeft = (data: { playerId: string; players: PlayerInfo[] }) => {
        console.log('Player left:', data);
        setPlayers(data.players);
      };

      // Handle player disconnections
      const handlePlayerDisconnected = (data: { playerId: string; studentId: string; playerName: string }) => {
        console.log('Player disconnected:', data);
        // Update UI to show player as disconnected but still in room
      };

      // Handle quiz starting
    const handleQuizStarted = (data: { roomId: string }) => {
      console.log('Quiz started event received:', data);
      
      if (data?.roomId && data.roomId === roomId) {
        // Quiz started, wait for new_question event to navigate
        console.log('Quiz started, waiting for first question...');
        setLoading(false);
      } else {
        console.warn('Quiz started for different room:', data?.roomId, 'expected:', roomId);
      }
    };

    // Handle first question - navigate to question route
    const handleNewQuestion = (data: { questionId: number; question: string; options: string[]; timeLimit: number }) => {
      console.log('First question received, navigating to quiz:', data);
      // Navigate to the question page
      navigate(`/student/room/${roomId}/question/${data.questionId}`);
    };      // Handle quiz/room ending
      const handleQuizEnded = (data: { message?: string }) => {
        console.log('Quiz ended:', data);
        localStorage.removeItem('studentInfo');
        alert(data?.message || 'Quiz has ended');
        navigate('/student/join');
      };

      // Handle room deletion
      const handleRoomDeleted = (data?: { message?: string }) => {
        console.log('Room deleted:', data);
        localStorage.removeItem('studentInfo');
        alert(data?.message || 'Room was deleted by teacher');
        navigate('/student/join');
      };

      // Handle errors
      const handleJoinError = (message: string) => {
        console.error('Join error:', message);
        
        // Clear stored session since room is invalid
        localStorage.removeItem('studentInfo');
        
        if (message.includes('Room not found') || message.includes('Room does not exist')) {
          // Room doesn't exist - redirect to join page
          navigate('/student/join');
        } else {
          // Other join errors - show message then redirect
          setError(message);
          setTimeout(() => {
            navigate('/student/join');
          }, 2000);
        }
      };

      socket.on('room_info', handleRoomInfo);
      socket.on('room_error', handleRoomError);
      socket.on('joined_room', handleJoinedRoom);
      socket.on('player_joined', handlePlayerJoined);
      socket.on('player_left', handlePlayerLeft);
      socket.on('player_disconnected', handlePlayerDisconnected);
      socket.on('quiz_started', handleQuizStarted);
      socket.on('new_question', handleNewQuestion);
      socket.on('quiz_ended', handleQuizEnded);
      socket.on('room_deleted', handleRoomDeleted);
      socket.on('join_error', handleJoinError);

      return () => {
        socket.off('room_info', handleRoomInfo);
        socket.off('room_error', handleRoomError);
        socket.off('joined_room', handleJoinedRoom);
        socket.off('player_joined', handlePlayerJoined);
        socket.off('player_left', handlePlayerLeft);
        socket.off('player_disconnected', handlePlayerDisconnected);
        socket.off('quiz_started', handleQuizStarted);
        socket.off('new_question', handleNewQuestion);
        socket.off('quiz_ended', handleQuizEnded);
        socket.off('room_deleted', handleRoomDeleted);
        socket.off('join_error', handleJoinError);
      };
    };

    if (!socket.connected) {
      console.log('Socket not connected, waiting for connection...');
      
      const handleConnect = () => {
        console.log('Socket connected in student waiting room');
        // Always validate room exists and rejoin on connect/refresh
        validateRoomAndRejoin();
        setupEventListeners();
      };

      socket.on('connect', handleConnect);
      
      const connectionTimeout = setTimeout(() => {
        if (!socket.connected) {
          setError('Could not connect to server. Please try again.');
          setLoading(false);
        }
      }, 10000);

      return () => {
        socket.off('connect', handleConnect);
        clearTimeout(connectionTimeout);
      };
    } else {
      // Socket already connected
      // Always validate room exists and rejoin on page load/refresh
      validateRoomAndRejoin();
      return setupEventListeners();
    }
  }, [socket, roomId, navigate, initialPlayers.length]);

  const leaveRoom = () => {
    if (!socket || !roomId) return;
    
    if (confirm('Are you sure you want to leave the room?')) {
      socket.emit('leave_room', roomId);
      // Clear stored student info
      localStorage.removeItem('studentInfo');
      navigate('/student/join');
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">
            {!socket ? 'Initializing connection...' : 
             !socket.connected ? 'Connecting to room...' : 
             'Validating room...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg max-w-md w-full">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>{error}</span>
          </div>
          <button 
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            onClick={() => navigate('/student/join')}
          >
            Back to Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title="Waiting Room"
      subtitle={quizName ? `Quiz: ${quizName} • Waiting for quiz to start` : "Waiting for quiz to start"}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* Players List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-lg px-6 py-4 text-center">
            <h4 className="text-xl font-semibold mb-0 flex items-center justify-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Students in Room ({players.length})
            </h4>
          </div>
          <div className="p-6">
            {players.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <h5 className="text-xl font-medium text-gray-600 mb-2">You're the first student here!</h5>
                <p className="text-gray-500">Waiting for other students to join...</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {players.map((player) => (
                  <span 
                    key={player.id}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-100 text-primary-800 border border-primary-200"
                  >
                    {player.name}
                  </span>
                ))}
              </div>
            )}

            <div className="text-center mt-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Waiting for teacher to start the quiz...
              </div>
              
              <button 
                className="border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
                onClick={leaveRoom}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Leave Room</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentWaitingRoom;
