import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';
import type { QuestionResults } from '../types/quiz.ts';

interface QuestionData {
  question: string;
  options: string[];
  timeLimit: number;
  remainingTime: number;
  questionId: number;
  currentScore?: number;
  currentStreak?: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  hasAnswered?: boolean;
  questionExpired?: boolean;
}

interface AnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  streak: number;
  totalScore: number;
}

const StudentQuizRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  console.log('StudentQuizRoom render:', { roomId, socket: !!socket, currentQuestion: !!currentQuestion });

  useEffect(() => {
    if (!socket || !roomId) {
      console.log('Waiting for socket and roomId:', { socket: !!socket, roomId });
      return;
    }

    const setupEventListeners = () => {
      // Handle new question from teacher
      const handleNewQuestion = (data: QuestionData) => {
        console.log('New question received:', data);
        setCurrentQuestion(data);
        setTimeRemaining(data.remainingTime || data.timeLimit);
        setHasSubmitted(data.hasAnswered || false);
        setAnswerResult(null);
        setWaitingForNext(false);
        setLoading(false);

        // Update score if provided
        if (data.currentScore !== undefined) {
          setScore(data.currentScore);
        }
        if (data.currentStreak !== undefined) {
          setStreak(data.currentStreak);
        }
      };

      // Handle answer feedback
      const handleAnswerResult = (data: AnswerResult) => {
        console.log('Answer result:', data);
        setAnswerResult(data);
        setScore(data.totalScore);
        setStreak(data.streak);
      };

      // Handle question ending
      const handleQuestionEnded = (data: QuestionResults) => {
        console.log('Question ended:', data);
        setWaitingForNext(true);
        // Show results or waiting state
      };

      // Handle quiz completion
      const handleQuizEnded = (data: { message?: string; historyId?: string }) => {
        console.log('Quiz ended:', data);
        localStorage.removeItem('studentInfo');
        alert(data.message || 'Quiz completed!');
        navigate('/student/join');
      };

      // Handle room deletion
      const handleRoomDeleted = () => {
        console.log('Room deleted');
        localStorage.removeItem('studentInfo');
        alert('Room was deleted by teacher');
        navigate('/student/join');
      };

      // Handle errors
      const handleAnswerError = (message: string) => {
        console.error('Answer error:', message);
        alert(`Error: ${message}`);
      };

      const handleJoinError = (message: string) => {
        console.error('Join error:', message);
        localStorage.removeItem('studentInfo');
        alert(`Room Error: ${message}`);
        navigate('/student/join');
      };

      socket.on('new_question', handleNewQuestion);
      socket.on('answer_result', handleAnswerResult);
      socket.on('question_ended', handleQuestionEnded);
      socket.on('quiz_ended', handleQuizEnded);
      socket.on('room_deleted', handleRoomDeleted);
      socket.on('answer_error', handleAnswerError);
      socket.on('join_error', handleJoinError);

      return () => {
        socket.off('new_question', handleNewQuestion);
        socket.off('answer_result', handleAnswerResult);
        socket.off('question_ended', handleQuestionEnded);
        socket.off('quiz_ended', handleQuizEnded);
        socket.off('room_deleted', handleRoomDeleted);
        socket.off('answer_error', handleAnswerError);
        socket.off('join_error', handleJoinError);
      };
    };

    // Try to rejoin room on component mount (for refresh scenarios)
    const rejoinRoom = () => {
      const storedInfo = localStorage.getItem('studentInfo');
      if (storedInfo) {
        try {
          const { playerName, studentId, roomId: storedRoomId } = JSON.parse(storedInfo);
          if (storedRoomId === roomId) {
            console.log('Rejoining quiz room:', { playerName, studentId, roomId });
            socket.emit('join_room', {
              roomId,
              playerName,
              studentId
            });
            return;
          }
        } catch (e) {
          console.warn('Failed to parse stored student info:', e);
        }
      }
      
      // If no stored info, redirect to join page
      console.log('No valid stored info, redirecting to join');
      navigate('/student/join');
    };

    if (!socket.connected) {
      const handleConnect = () => {
        console.log('Socket connected in student quiz room');
        rejoinRoom();
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
      rejoinRoom();
      return setupEventListeners();
    }
  }, [socket, roomId, navigate]);

  // Timer countdown effect
  useEffect(() => {
    if (!currentQuestion || hasSubmitted || timeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up, auto-submit or disable answering
          setHasSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, hasSubmitted, timeRemaining]);

  const submitAnswer = (answerId: number) => {
    if (!socket || !roomId || hasSubmitted || timeRemaining <= 0) {
      return;
    }

    console.log('Submitting answer:', { answerId, questionId: currentQuestion?.questionId });
    
    socket.emit('submit_answer', {
      roomId,
      answerId
    });

    setHasSubmitted(true);
  };

  const leaveQuiz = () => {
    if (!socket || !roomId) return;
    
    if (confirm('Are you sure you want to leave the quiz? Your progress will be lost.')) {
      socket.emit('leave_room', roomId);
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
            {!socket ? 'Connecting...' : 
             !socket.connected ? 'Connecting to quiz...' : 
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
            onClick={() => navigate('/student/join')}
          >
            Back to Join
          </button>
        </div>
      </div>
    );
  }

  if (waitingForNext) {
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
        
        <div className="question-results-container">
          <div className="question-results-content text-center">
            <div className="alert mb-4">
              {answerResult ? (
                answerResult.isCorrect ? (
                  <div className="alert-success">
                    <i className="bi bi-check-circle"></i> Your answer is correct!
                  </div>
                ) : (
                  <div className="alert-danger">
                    <i className="bi bi-x-circle"></i> Your answer is incorrect!
                  </div>
                )
              ) : (
                <div className="alert-warning">
                  <i className="bi bi-exclamation-triangle"></i> No answer in time!
                </div>
              )}
            </div>

            <div className="mb-4">
              <h4>Your Score: <span>{score}</span></h4>
              {streak > 1 && (
                <div>
                  <span className="streak-badge">
                    <i className="bi bi-lightning-fill"></i>
                    {streak}x
                  </span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Waiting for the next question...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="bi bi-hourglass-split display-1 text-muted"></i>
                </div>
                <h3 className="mb-3">Waiting for Quiz to Start</h3>
                <p className="text-muted">Room ID: <strong>{roomId}</strong></p>
                <p className="text-muted">The teacher will start the quiz shortly...</p>
                
                <button 
                  className="btn btn-outline-danger mt-3"
                  onClick={leaveQuiz}
                >
                  <i className="bi bi-box-arrow-left me-2"></i>
                  Leave Quiz
                </button>
              </div>
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

      {hasSubmitted ? (
        // Waiting state after submission
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="alert alert-warning" style={{ fontSize: '1.2rem' }}>
              <div className="spinner-border text-warning me-2" role="status" style={{ verticalAlign: 'middle' }}></div>
              Waiting for other players or time to end...
            </div>
            
            {/* Show score info when submitted */}
            <div className="alert alert-info">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-trophy-fill"></i> Your Score: <span>{score}</span>
                </div>
                {streak > 1 && (
                  <div>
                    <span className="streak-badge">
                      <i className="bi bi-lightning-fill"></i>
                      {streak}x
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Question display
        <div className="card quiz-question-screen">
          <div 
            className="card-header bg-success"
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
          <div className="card-body question-container">
            <h3 className="mb-4 text-center">{currentQuestion.question}</h3>
            
            <div className="row mb-4">
              {currentQuestion.options.map((option, index) => {
                const isDisabled = timeRemaining <= 0;
                
                return (
                  <div key={index} className="col-md-6 mb-2">
                    <button
                      className={`option-btn option-${index} btn w-100 text-white`}
                      onClick={() => !isDisabled && submitAnswer(index)}
                      disabled={isDisabled}
                      style={{
                        cursor: isDisabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {option}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Score info display (only show if not first question) */}
            {currentQuestion.currentQuestionIndex > 0 && (
              <div className="alert alert-info">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className="bi bi-trophy-fill"></i> Your Score: <span>{score}</span>
                  </div>
                  {streak > 1 && (
                    <div>
                      <span className="streak-badge">
                        <i className="bi bi-lightning-fill"></i>
                        {streak}x
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQuizRoom;
