import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../hooks/useAuth.js';
import type { QuestionResults } from '../types/quiz.ts';

interface QuestionData {
  question: string;
  options: string[];
  timeLimit: number;
  remainingTime: number;
  questionId: number;
  currentQuestionIndex: number;
  totalQuestions: number;
}

const TeacherQuizRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { socket } = useSocket();
  const { teacherId, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionResults, setQuestionResults] = useState<QuestionResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizEnded, setQuizEnded] = useState(false);

  console.log('TeacherQuizRoom render:', { roomId, socket: !!socket, currentQuestion: !!currentQuestion });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/teacher/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!socket || !roomId || !isAuthenticated) {
      console.log('Missing requirements:', { socket: !!socket, roomId, isAuthenticated });
      return;
    }

    const setupEventListeners = () => {
      // Handle new question started
      const handleNewQuestion = (data: QuestionData) => {
        console.log('New question started:', data);
        setCurrentQuestion(data);
        setTimeRemaining(data.remainingTime || data.timeLimit);
        setQuestionResults(null);
        setLoading(false);
      };

      // Handle student answer submissions
      const handlePlayerAnswered = (data: { playerId: string; playerName: string; studentId: string; answerId: number; timeTaken: number }) => {
        console.log('Player answered:', data);
        // Could add visual feedback for answered students
      };

      // Handle question results when time ends
      const handleQuestionEnded = (data: QuestionResults) => {
        console.log('Question ended with results:', data);
        setQuestionResults(data);
        setTimeRemaining(0);
      };

      // Handle player joining during quiz
      const handlePlayerJoined = (data: { playerId: string; playerName: string; studentId: string; players: Array<{ id: string; name: string; studentId: string; score: number }> }) => {
        console.log('Player joined during quiz:', data);
      };

      // Handle player leaving during quiz
      const handlePlayerLeft = (data: { playerId: string; players: Array<{ id: string; name: string; studentId: string; score: number }> }) => {
        console.log('Player left during quiz:', data);
      };

      // Handle quiz completion
      const handleQuizCompleted = (data: { message?: string; historyId?: string }) => {
        console.log('Quiz completed:', data);
        setQuizEnded(true);
        // Could show final results or redirect
      };

      // Handle room errors
      const handleRoomError = (message: string) => {
        console.error('Room error:', message);
        setError(message);
        setLoading(false);
      };

      socket.on('new_question', handleNewQuestion);
      socket.on('player_answered', handlePlayerAnswered);
      socket.on('question_ended', handleQuestionEnded);
      socket.on('player_joined', handlePlayerJoined);
      socket.on('player_left', handlePlayerLeft);
      socket.on('quiz_ended', handleQuizCompleted);
      socket.on('room_error', handleRoomError);

      return () => {
        socket.off('new_question', handleNewQuestion);
        socket.off('player_answered', handlePlayerAnswered);
        socket.off('question_ended', handleQuestionEnded);
        socket.off('player_joined', handlePlayerJoined);
        socket.off('player_left', handlePlayerLeft);
        socket.off('quiz_ended', handleQuizCompleted);
        socket.off('room_error', handleRoomError);
      };
    };

    // Rejoin room as teacher on component mount
    const rejoinTeacherRoom = () => {
      console.log('Teacher rejoining quiz room:', { roomId, teacherId });
      socket.emit('join_teacher_room', {
        roomId,
        teacherId: teacherId || 'unknown'
      });
    };

    if (!socket.connected) {
      const handleConnect = () => {
        console.log('Socket connected in teacher quiz room');
        rejoinTeacherRoom();
        setupEventListeners();
      };

      socket.on('connect', handleConnect);
      
      const connectionTimeout = setTimeout(() => {
        if (!socket.connected) {
          setError('Could not connect to server');
          setLoading(false);
        }
      }, 10000);

      return () => {
        socket.off('connect', handleConnect);
        clearTimeout(connectionTimeout);
      };
    } else {
      rejoinTeacherRoom();
      return setupEventListeners();
    }
  }, [socket, roomId, teacherId, isAuthenticated, navigate]);

  // Timer countdown effect
  useEffect(() => {
    if (!currentQuestion || timeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, timeRemaining]);

  const startQuiz = () => {
    if (!socket || !roomId) return;
    console.log('Starting quiz for room:', roomId);
    socket.emit('start_quiz', { roomId });
  };

  const nextQuestion = () => {
    if (!socket || !roomId) return;
    console.log('Moving to next question for room:', roomId);
    socket.emit('next_question', roomId);
  };

  const endQuiz = () => {
    if (!socket || !roomId) return;
    
    if (confirm('Are you sure you want to end the quiz? This cannot be undone.')) {
      console.log('Ending quiz for room:', roomId);
      // For now, just delete the room to end the quiz
      socket.emit('delete_room', { roomId });
    }
  };

  const backToDashboard = () => {
    if (confirm('Are you sure you want to leave? The quiz will continue without you.')) {
      navigate('/teacher/dashboard');
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">
            {!socket ? 'Connecting...' : 
             !socket.connected ? 'Connecting to quiz room...' : 
             'Loading quiz...'}
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

  if (quizEnded) {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="card border-success">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="bi bi-trophy display-1 text-success"></i>
                </div>
                <h2 className="text-success mb-3">Quiz Completed!</h2>
                <p className="text-muted mb-4">Great job running the quiz!</p>
                
                <div className="d-flex gap-3 justify-content-center">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/teacher/dashboard')}
                  >
                    <i className="bi bi-house me-2"></i>
                    Back to Dashboard
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => window.location.reload()}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    View Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container mt-3">
        <div className="text-center mt-3 mb-4">
          <img
            src="/quiz-quest-logo-horizontal.png"
            alt="Quiz Quest"
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto'
            }}
          />
        </div>
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="mb-4">
              <i className="bi bi-play-circle display-1 text-primary"></i>
            </div>
            <h3 className="mb-3">Ready to Start Quiz</h3>
            <p className="text-muted mb-4">Room ID: <strong>{roomId}</strong></p>
            <p className="text-muted mb-4">Students are waiting for you to begin...</p>
            
            <div className="d-flex gap-3 justify-content-center">
              <button 
                className="btn btn-success btn-lg px-5"
                onClick={startQuiz}
              >
                <i className="bi bi-play-fill me-2"></i>
                Start Quiz
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={backToDashboard}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-3">
      {/* Header Logo */}
      <div className="text-center mt-3 mb-4">
        <img
          src="/quiz-quest-logo-horizontal.png"
          alt="Quiz Quest"
          style={{
            width: '100%',
            maxWidth: '400px',
            height: 'auto'
          }}
        />
      </div>

      {/* Question Progress */}
      <div className="row mb-4">
        <div className="col-lg-10 mx-auto">
          <div className="progress mb-2" style={{ height: '12px' }}>
            <div 
              className="progress-bar bg-primary" 
              style={{ 
                width: `${((currentQuestion.currentQuestionIndex + 1) / currentQuestion.totalQuestions) * 100}%` 
              }}
            ></div>
          </div>
          <p className="text-center text-muted mb-0">
            Question {currentQuestion.currentQuestionIndex + 1} of {currentQuestion.totalQuestions}
          </p>
        </div>
      </div>

      <div className="row">
        {/* Current Question */}
        <div className="col-md-8 offset-md-2">
          <div className="card">
            <div 
              className="card-header bg-primary"
              style={{ color: '#000000' }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h4>Question {currentQuestion.currentQuestionIndex + 1}</h4>
                <div className="h3">{timeRemaining}s</div>
              </div>
              <div className="progress">
                <div
                  className="timer-bar progress-bar"
                  style={{ 
                    width: `${(timeRemaining / currentQuestion.timeLimit) * 100}%`,
                    backgroundColor: '#3498db'
                  }}
                ></div>
              </div>
            </div>
            <div className="card-body">
              <h3 className="mb-4 text-center">{currentQuestion.question}</h3>

              {/* Answer Options - Teacher View (No interaction) */}
              <div className="row mb-4">
                {currentQuestion.options.map((option, index) => {
                  const isCorrect = questionResults && index === questionResults.correctAnswer;
                  
                  return (
                    <div key={index} className="col-md-6 mb-2">
                      <div
                        className={`option-btn option-${index} btn w-100 text-white ${isCorrect ? 'correct-answer' : ''}`}
                        style={{ cursor: 'default' }}
                      >
                        {isCorrect && (
                          <span className="correct-indicator me-2">
                            <i className="bi bi-check-circle-fill" style={{ fontSize: '1.5rem', color: '#ffffff' }}></i>
                          </span>
                        )}
                        {option}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="alert alert-info">
                <i className="bi bi-info-circle"></i> You are in teacher view. Students are answering this question.
              </div>

              {/* Question Controls */}
              <div className="mt-4">
                {!questionResults ? (
                  <div className="d-flex gap-2">
                    <div className="alert alert-info flex-grow-1 mb-0">
                      <i className="bi bi-clock me-2"></i>
                      Question in progress... Wait for time to expire or all students to answer.
                    </div>
                  </div>
                ) : (
                  <div className="d-grid">
                    {currentQuestion.currentQuestionIndex + 1 < currentQuestion.totalQuestions ? (
                      <button 
                        className="btn btn-lg btn-primary"
                        onClick={nextQuestion}
                      >
                        <i className="bi bi-arrow-right me-2"></i>
                        Next Question
                      </button>
                    ) : (
                      <button 
                        className="btn btn-lg btn-success"
                        onClick={endQuiz}
                      >
                        <i className="bi bi-trophy me-2"></i>
                        Finalize Quiz
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherQuizRoom;
