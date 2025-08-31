import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const StudentJoin = () => {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  
  const [playerName, setPlayerName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [roomId, setRoomId] = useState(urlRoomId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

    // TODO: Implement socket connection and room joining logic
    console.log('Joining room:', { playerName, studentId, roomId });
    
    // For now, just simulate success
    setTimeout(() => {
      setIsLoading(false);
      // Will navigate to waiting room in next iteration
      console.log('Would navigate to:', `/student/room/${roomId}/waiting`);
    }, 1000);
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
