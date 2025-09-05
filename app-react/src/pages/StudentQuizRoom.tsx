import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.ts';
import type { NewQuestionData } from '../types/socket.ts';
import type { QuestionResults, PlayerAnswer } from '../types/quiz.ts';
import Layout from '../components/Layout';

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
    if (isResultRoute && questionId) {
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
  }, [roomId, questionId, location.pathname, socket, navigate, isQuestionRoute, isSubmitRoute, isResultRoute, validateSession]);

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
      
      // Clear session since quiz is completed
      localStorage.removeItem('studentSession');
      localStorage.removeItem('finalScore');
      
      // Navigate directly to join page
      navigate('/student/join');
    };

    const handleJoinError = (message: string) => {
      console.error('Join error:', message);
      
      // Clear any stored session since room is invalid
      localStorage.removeItem('studentSession');
      
      if (message.includes('Room not found') || message.includes('Room does not exist')) {
        // Room doesn't exist - redirect to join page
        navigate('/student/join');
      } else {
        // Other join errors (e.g., quiz already started)
        alert(`Error joining room: ${message}`);
        navigate('/student/join');
      }
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
  }, [socket, roomId, navigate, questionId, saveSession, score]);

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
      <Layout 
        title="Loading..."
        subtitle="Validating your session..."
      >
        <div className="container mt-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Validating session...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Submit Screen (waiting for others to answer)
  if (isSubmitRoute) {
    return (
      <Layout 
        title="Answer Submitted"
        subtitle="Waiting for other students to finish..."
      >
        <div className="container">
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
      </Layout>
    );
  }

  // Result Screen (waiting for next question or showing answer feedback)
  if (isResultRoute) {
    return (
      <Layout 
        title="Question Results"
        subtitle="See the correct answer and wait for the next question"
      >
        <div className="container">
          <div className="question-results-container">
          <div className="question-results-content text-center">
            {answerResult ? (
              <>
                <div className="mb-6">
                  {answerResult.isCorrect ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your answer is correct!
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your answer is incorrect!
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-2xl font-bold">Your Score: <span className="text-primary-600">{score}</span></h4>
                  {streak > 1 && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                        {streak}x
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
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
      </Layout>
    );
  }

  // Question Screen
  if (isQuestionRoute && currentQuestion) {
    return (
      <Layout 
        title={`Question ${currentQuestion.questionId}`}
        subtitle={`Room ID: ${roomId} • ${timeLeft}s remaining`}
      >
        <div className="container">

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
      </Layout>
    );
  }

  // Loading/validation state
  return (
    <Layout 
      title="Loading Quiz..."
      subtitle="Connecting to quiz room..."
    >
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading quiz...</p>
        </div>
      </div>
    </Layout>
  );
}
