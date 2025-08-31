import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.ts';
import type { NewQuestionData } from '../types/socket.ts';
import type { QuestionResults, PlayerAnswer } from '../types/quiz.ts';

interface Question {
  questionId: string;
  question: string;
  options: string[];
  timeLimit: number;
  remainingTime?: number;
}

interface AnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  streak: number;
  totalScore: number;
}

interface QuizState {
  currentRoom: string | null;
  playerName: string | null;
  studentId: string | null;
  currentScore: number;
  currentStreak: number;
  hasAnswered: boolean;
  currentQuestionIndex: number;
}

export default function StudentQuizRoom() {
  const { roomId, questionId } = useParams<{ roomId: string; questionId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [sessionValid, setSessionValid] = useState<boolean>(false);
  const [waitingForNext, setWaitingForNext] = useState<boolean>(false);

  // Get current route state
  const isQuestionRoute = location.pathname.includes('/question/');
  const isSubmitRoute = location.pathname.includes('/submit/');
  const isResultRoute = location.pathname.includes('/result/');
  const isFinalRoute = location.pathname.includes('/final');

  // Mark waitingForNext as used for state tracking
  console.log('Waiting state:', waitingForNext); // Used for debugging state

  // Session management - similar to original app's localStorage usage
  const getStoredSession = (): QuizState | null => {
    try {
      const stored = localStorage.getItem('studentSession');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const saveSession = useCallback((state: Partial<QuizState>) => {
    const currentSession = getStoredSession() || {};
    const newSession = { ...currentSession, ...state };
    localStorage.setItem('studentSession', JSON.stringify(newSession));
  }, []);

  // Validate session on route change/refresh
  const validateSession = useCallback(() => {
    const session = getStoredSession();
    if (!session || !session.playerName || !session.studentId || session.currentRoom !== roomId) {
      // Session expired or invalid
      localStorage.removeItem('studentSession');
      navigate('/student/join');
      return false;
    }
    
    // Restore state from session
    setScore(session.currentScore || 0);
    setStreak(session.currentStreak || 0);
    setCurrentQuestionIndex(session.currentQuestionIndex || 0);
    setHasAnswered(session.hasAnswered || false);
    
    return true;
  }, [roomId, navigate]);

  // Handle route changes and state restoration on mount/refresh
  useEffect(() => {
    if (!roomId) {
      navigate('/student/join');
      return;
    }

    // Validate session first
    if (!validateSession()) {
      return;
    }

    setSessionValid(true);

    // Attempt to rejoin room if not connected
    const session = getStoredSession();
    if (session && socket && session.currentRoom && session.playerName && session.studentId) {
      console.log(`Rejoining room ${roomId} from URL state`);
      socket.emit('join_room', {
        roomId: session.currentRoom,
        playerName: session.playerName,
        studentId: session.studentId,
      });
    }

    // Handle different route states for refresh scenarios
    if (isFinalRoute) {
      // For final results - custom logic since not in allowed events
      console.log('Final results route - would request final results');
    } else if (isResultRoute && questionId) {
      // On result page, waiting for next question
      console.log('Result route - waiting for next question');
    } else if (isSubmitRoute && questionId) {
      // On submit page, waiting for others to answer
      console.log('Submit route - waiting for others to answer');
      setWaitingForNext(true);
    } else if (isQuestionRoute && questionId) {
      // On question page - custom logic for question state
      console.log('Question route - would request question state');
    }
  }, [roomId, questionId, location.pathname, socket, navigate, isQuestionRoute, isSubmitRoute, isResultRoute, isFinalRoute, validateSession]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleJoinedRoom = (data: { roomId: string; isActive: boolean }) => {
      const { roomId: joinedRoomId, isActive } = data;
      
      // Update session with confirmed room connection
      saveSession({ 
        currentRoom: joinedRoomId,
        playerName: getStoredSession()?.playerName || null,
        studentId: getStoredSession()?.studentId || null
      });

      if (!isActive) {
        // Quiz hasn't started, go to waiting room
        navigate(`/student/room/${joinedRoomId}/waiting`);
      }
      // If quiz is active, wait for new_question event to handle navigation
    };

    const handleNewQuestion = (data: NewQuestionData) => {
      const {
        question,
        options,
        timeLimit,
        remainingTime,
        questionId: newQuestionId,
        currentScore: serverScore,
        currentStreak: serverStreak,
        currentQuestionIndex: serverQuestionIndex,
        hasAnswered: serverHasAnswered,
        questionExpired: serverQuestionExpired,
      } = data;

      // Update question state
      setCurrentQuestion({
        questionId: newQuestionId.toString(),
        question,
        options,
        timeLimit,
        remainingTime,
      });

      setTimeLeft(remainingTime || timeLimit);
      setScore(serverScore || 0);
      setStreak(serverStreak || 0);
      setCurrentQuestionIndex(serverQuestionIndex || 0);
      setHasAnswered(serverHasAnswered || false);
      setWaitingForNext(false);

      // Save updated state
      saveSession({
        currentScore: serverScore || 0,
        currentStreak: serverStreak || 0,
        currentQuestionIndex: serverQuestionIndex || 0,
        hasAnswered: serverHasAnswered || false,
      });

      // Navigate based on question state
      if (serverHasAnswered && serverQuestionExpired) {
        // Already answered and time expired - show results
        navigate(`/student/room/${roomId}/result/${newQuestionId}`);
      } else if (serverHasAnswered && !serverQuestionExpired) {
        // Answered but time not expired - show waiting state
        setWaitingForNext(true);
        navigate(`/student/room/${roomId}/question/${newQuestionId}`);
      } else {
        // New question or refreshed during active question
        navigate(`/student/room/${roomId}/question/${newQuestionId}`);
      }
    };

    const handleQuestionEnded = (data: QuestionResults) => {
      setWaitingForNext(true);
      
      // Find current player's answer result
      const playerAnswer = data.playerAnswers?.find((a: PlayerAnswer) => a.playerId === socket?.id);
      
      if (playerAnswer) {
        setAnswerResult({
          isCorrect: playerAnswer.isCorrect,
          pointsEarned: 0, // Not in PlayerAnswer interface
          streak: 0, // Not in PlayerAnswer interface  
          totalScore: playerAnswer.score || 0,
        });
        
        // Update scores
        setScore(playerAnswer.score || 0);
        
        // Save session state
        saveSession({
          currentScore: playerAnswer.score || 0,
        });
      }
      
      // Navigate to result page
      if (roomId && data.questionId) {
        navigate(`/student/room/${roomId}/result/${data.questionId}`);
      }
    };

    const handleQuizEnded = (data: { message?: string; historyId?: string }) => {
      console.log('Quiz ended:', data);
      
      // Navigate to final results
      if (roomId) {
        navigate(`/student/room/${roomId}/final`);
      }
    };

    const handleJoinError = (message: string) => {
      alert(`Error joining room: ${message}`);
      localStorage.removeItem('studentSession');
      navigate('/student/join');
    };

    // Register event listeners
    socket.on('joined_room', handleJoinedRoom);
    socket.on('new_question', handleNewQuestion);
    socket.on('question_ended', handleQuestionEnded);
    socket.on('quiz_ended', handleQuizEnded);
    socket.on('join_error', handleJoinError);

    return () => {
      socket.off('joined_room', handleJoinedRoom);
      socket.off('new_question', handleNewQuestion);
      socket.off('question_ended', handleQuestionEnded);
      socket.off('quiz_ended', handleQuizEnded);
      socket.off('join_error', handleJoinError);
    };
  }, [socket, roomId, navigate, questionId, saveSession]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 || !isQuestionRoute || hasAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasAnswered) {
            // Time up, but don't auto-submit, just lock options
            setHasAnswered(true);
            saveSession({ hasAnswered: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isQuestionRoute, hasAnswered, saveSession]);

  const submitAnswer = (optionIndex: number) => {
    if (hasAnswered || !socket || !currentQuestion || !roomId) return;

    setHasAnswered(true);
    saveSession({ hasAnswered: true });

    socket.emit('submit_answer', {
      roomId,
      answerId: optionIndex,
    });

    // Navigate to submit state (waiting for others to answer)
    navigate(`/student/room/${roomId}/submit/${currentQuestion.questionId}`);
    setWaitingForNext(true);
  };

  if (!sessionValid) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Validating session...</p>
        </div>
      </div>
    );
  }

  // Final Results Screen
  if (isFinalRoute) {
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
            <h2 className="mb-4">Quiz Complete!</h2>
            <div className="mb-4">
              <h3>Final Score: <span>{score}</span></h3>
              <p>Thank you for playing!</p>
            </div>
            <button 
              className="btn btn-success btn-lg"
              onClick={() => navigate('/student/join')}
            >
              Join Another Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Submit Screen (waiting for others to answer)
  if (isSubmitRoute) {
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
            <h2 className="mb-4">Answer Submitted!</h2>
            <div className="mb-4">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
            </div>
            <p className="lead mb-4">
              Your answer has been submitted successfully.
            </p>
            <p className="text-muted">
              Waiting for other students to finish...
            </p>
            <div className="mt-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result Screen (waiting for next question or showing answer feedback)
  if (isResultRoute) {
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
            {answerResult ? (
              <>
                <div className="alert mb-4">
                  {answerResult.isCorrect ? (
                    <div className="alert-success">
                      <i className="bi bi-check-circle"></i> Your answer is correct!
                    </div>
                  ) : (
                    <div className="alert-danger">
                      <i className="bi bi-x-circle"></i> Your answer is incorrect!
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
              </>
            ) : (
              <div className="alert alert-warning mb-4">
                <i className="bi bi-exclamation-triangle"></i> No answer in time!
              </div>
            )}

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

  // Question Screen
  if (isQuestionRoute && currentQuestion) {
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

        <div className="quiz-question-screen">
          {/* Timer */}
          <div className="timer-display">
            {timeLeft}s
          </div>

          {/* Question Number and Score */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Question {currentQuestionIndex + 1}</h5>
            {currentQuestionIndex > 0 && (
              <div className="text-end">
                <span>Score: {score}</span>
                {streak > 1 && (
                  <span className="streak-badge ms-2">
                    <i className="bi bi-lightning-fill"></i>
                    {streak}x
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Question Text */}
          <div className="question-text">
            {currentQuestion.question}
          </div>

          {/* Options - immediate submission on click */}
          <div className="row">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="col-12 mb-3">
                <button
                  className={`option-btn option-${index} w-100`}
                  onClick={() => submitAnswer(index)}
                  disabled={hasAnswered}
                >
                  {option}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Loading/validation state
  return (
    <div className="container mt-5">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading quiz...</p>
      </div>
    </div>
  );
}
