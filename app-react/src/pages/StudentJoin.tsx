import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';

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
  
  const [playerName, setPlayerName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [roomId, setRoomId] = useState(urlRoomId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleJoinedRoom = (data: JoinedRoomData) => {
      console.log('Successfully joined room:', data);
      setIsLoading(false);
      
      // Store student info in localStorage for refresh scenarios
      localStorage.setItem('studentInfo', JSON.stringify({
        playerName: playerName.trim(),
        studentId: studentId.trim(),
        roomId: data.roomId
      }));
      
      // Navigate to student waiting room or quiz room based on quiz status
      if (data.isActive) {
        navigate(`/student/room/${data.roomId}/quiz`);
      } else {
        // Pass initial players data to waiting room
        navigate(`/student/room/${data.roomId}/waiting`, {
          state: { initialPlayers: data.players }
        });
      }
    };

    const handleJoinError = (message: string) => {
      console.error('Join error:', message);
      setError(message);
      setIsLoading(false);
    };

    socket.on('joined_room', handleJoinedRoom);
    socket.on('join_error', handleJoinError);

    return () => {
      socket.off('joined_room', handleJoinedRoom);
      socket.off('join_error', handleJoinError);
    };
  }, [socket, navigate, playerName, studentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!playerName.trim() || !studentId.trim() || !roomId.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!socket) {
      setError('Connection not available. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    if (!socket.connected) {
      setError('Not connected to server. Please refresh the page.');
      setIsLoading(false);
      return;
    }

    console.log('Attempting to join room:', { playerName: playerName.trim(), studentId: studentId.trim(), roomId: roomId.trim() });
    
    // Emit join room event
    socket.emit('join_room', {
      roomId: roomId.trim(),
      playerName: playerName.trim(),
      studentId: studentId.trim()
    });
  };

  return (
    <div className="container mt-3">
      <div className="row">
        <div className="col-12 p-0">
          <div className="join-quiz-container">
            <div className="text-center mt-3 mb-4">
              <Link to="/" className="quiz-logo-clickable">
                <img
                  src="/quiz-quest-logo-horizontal.png"
                  alt="Quiz Quest"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: 'auto',
                    maxHeight: 'none'
                  }}
                />
              </Link>
            </div>
            
            <div className="join-quiz-content">
              <form id="joinForm" onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="playerName" className="form-label">Your Name</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="playerName"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="studentId" className="form-label">Student ID</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="studentId"
                    placeholder="Enter your student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="roomId" className="form-label">Room ID</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
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
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
              </form>
            </div>
            
            <div className="join-quiz-button">
              <div className="d-grid">
                <button
                  type="submit"
                  form="joinForm"
                  className="btn btn-lg btn-success"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Joining...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i> Join Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentJoin;
