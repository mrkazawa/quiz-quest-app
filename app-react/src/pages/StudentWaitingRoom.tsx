import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';

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
      <div className="container py-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-primary ms-3"
            onClick={() => navigate('/student/join')}
          >
            Back to Join
          </button>
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
              <h1 className="mb-1">Waiting for Quiz to Start</h1>
              <p className="text-muted mb-0">Room ID: <strong>{roomId}</strong></p>
              {quizName && <p className="text-muted mb-0">Quiz: {quizName}</p>}
            </div>
            <div>
              <button 
                className="btn btn-outline-danger"
                onClick={leaveRoom}
              >
                <i className="bi bi-box-arrow-left me-2"></i>
                Leave Room
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="row">
        <div className="col-lg-10 mx-auto">
          <div className="card">
            <div className="card-header text-center">
              <h4 className="card-title mb-0">
                <i className="bi bi-people me-2"></i>
                Students in Room ({players.length})
              </h4>
            </div>
            <div className="card-body">
              {players.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-person-plus display-1 text-muted"></i>
                  <h5 className="text-muted mt-3">You're the first student here!</h5>
                  <p className="text-muted">Waiting for other students to join...</p>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {players.map((player) => (
                    <span 
                      key={player.id}
                      className="badge bg-light text-dark border border-primary fs-6 px-3 py-2"
                      style={{ fontWeight: 500, whiteSpace: 'nowrap' }}
                    >
                      {player.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-center mt-4">
                <div className="alert alert-info">
                  <i className="bi bi-clock me-2"></i>
                  Waiting for teacher to start the quiz...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentWaitingRoom;
