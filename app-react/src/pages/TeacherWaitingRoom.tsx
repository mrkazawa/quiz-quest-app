import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../hooks/useAuth.js';

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
      setError('This room no longer exists. Please create a new room from the dashboard.');
      setLoading(false);
    };

    socket.on('room_info', handleRoomInfo);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('room_deleted', handleRoomDeleted);
    socket.on('room_error', handleRoomError);

    return () => {
      socket.off('room_info', handleRoomInfo);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('room_deleted', handleRoomDeleted);
      socket.off('room_error', handleRoomError);
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

  const copyRoomLink = () => {
    const url = `${window.location.origin}/student/join/${roomId}`;
    navigator.clipboard.writeText(url);
    // Could add a toast notification here
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
             !socket.connected ? 'Connecting to server...' : 
             'Loading room information...'}
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
            onClick={() => navigate('/teacher/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!roomInfo) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          <i className="bi bi-info-circle me-2"></i>
          Room not found or no longer exists.
          <button 
            className="btn btn-primary ms-3"
            onClick={() => navigate('/teacher/dashboard')}
          >
            Back to Dashboard
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
              <h1 className="mb-1">Waiting Room</h1>
              <p className="text-muted mb-0">{roomInfo.quizName}</p>
            </div>
            <div>
              <button 
                className="btn btn-outline-secondary me-2"
                onClick={() => navigate('/teacher/dashboard')}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Dashboard
              </button>
              <button 
                className="btn btn-outline-danger"
                onClick={deleteRoom}
              >
                <i className="bi bi-trash me-2"></i>
                Delete Room
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Room Info & Controls */}
        <div className="col-lg-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-door-open me-2"></i>
                Room Details
              </h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Room ID</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control fw-bold fs-4 text-center" 
                    value={roomId} 
                    readOnly 
                  />
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={copyRoomLink}
                  >
                    <i className="bi bi-clipboard"></i>
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Join URL</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    value={`${window.location.origin}/student/join/${roomId}`}
                    readOnly 
                  />
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={copyRoomLink}
                  >
                    <i className="bi bi-clipboard"></i>
                  </button>
                </div>
              </div>

              <div className="mb-3 text-center">
                <label className="form-label fw-bold">QR Code</label>
                <div className="border rounded p-3 bg-white">
                  <QRCodeSVG 
                    value={`${window.location.origin}/student/join/${roomId}`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <small className="text-muted">Students can scan this QR code to join</small>
              </div>

              <div className="d-grid gap-2">
                <button 
                  className="btn btn-success btn-lg"
                  onClick={startQuiz}
                  disabled={students.length === 0}
                >
                  <i className="bi bi-play-circle me-2"></i>
                  Start Quiz ({students.length} students)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title mb-0">
                <i className="bi bi-people me-2"></i>
                Joined Students ({students.length})
              </h4>
            </div>
            <div className="card-body">
              {students.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-people display-1 text-muted"></i>
                  <h5 className="text-muted mt-3">Waiting for students to join...</h5>
                  <p className="text-muted">Share the Room ID or URL with your students</p>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {students.map((student) => (
                    <span 
                      key={student.socketId}
                      className="badge bg-light text-dark border border-primary fs-6 px-3 py-2"
                      style={{ fontWeight: 500, whiteSpace: 'nowrap' }}
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
  );
};

export default TeacherWaitingRoom;
