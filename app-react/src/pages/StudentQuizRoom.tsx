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

interface RoomInfo {
  roomId: string;
  quizName: string;
  students: Array<{
    socketId: string;
    studentId: string;
    name: string;
    joinedAt: number;
  }>;
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
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [sessionValid, setSessionValid] = useState<boolean>(false);
  const [waitingForNext, setWaitingForNext] = useState<boolean>(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

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

      // Request room info to get quiz name
      if (socket) {
        socket.emit('get_room_info', { roomId: joinedRoomId });
      }

      if (!isActive) {
        // Quiz hasn't started, go to waiting room
        navigate(`/student/room/${joinedRoomId}/waiting`);
      }
      // If quiz is active, wait for new_question event to handle navigation
    };

    const handleRoomInfo = (data: RoomInfo) => {
      console.log('Student received room info:', data);
      setRoomInfo(data);
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
        totalQuestions: serverTotalQuestions,
        hasAnswered: serverHasAnswered,
        questionExpired: serverQuestionExpired,
      } = data;

      // Update question state
      setCurrentQuestion({
        questionId: newQuestionId.toString(),
        question,
        options: options || [], // Provide fallback empty array
        timeLimit,
        remainingTime,
      });

      setTimeLeft(remainingTime || timeLimit);
      setScore(serverScore || 0);
      setStreak(serverStreak || 0);
      setCurrentQuestionIndex(serverQuestionIndex || 0);
      setTotalQuestions(serverTotalQuestions || 0);
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

    // Handle room deletion
    const handleRoomDeleted = (data?: { message?: string }) => {
      console.log('Room deleted:', data);
      localStorage.removeItem('studentSession');
      alert(data?.message || 'Room was deleted by teacher');
      navigate('/student/join');
    };

    // Register event listeners
    socket.on('room_info', handleRoomInfo);
    socket.on('joined_room', handleJoinedRoom);
    socket.on('new_question', handleNewQuestion);
    socket.on('question_ended', handleQuestionEnded);
    socket.on('quiz_ended', handleQuizEnded);
    socket.on('room_deleted', handleRoomDeleted);
    socket.on('join_error', handleJoinError);

    return () => {
      socket.off('room_info', handleRoomInfo);
      socket.off('joined_room', handleJoinedRoom);
      socket.off('new_question', handleNewQuestion);
      socket.off('question_ended', handleQuestionEnded);
      socket.off('quiz_ended', handleQuizEnded);
      socket.off('room_deleted', handleRoomDeleted);
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
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
      >
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-4 text-gray-600">Validating session...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Submit Screen (waiting for others to answer)
  if (isSubmitRoute) {
    return (
      <Layout 
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Answer Submitted!</h2>
                <p className="text-lg text-gray-700">
                  Your answer has been submitted successfully.
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium">
                  Waiting for other students to finish...
                </p>
              </div>

              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" role="status">
                <span className="sr-only">Loading...</span>
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
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              {answerResult ? (
                <>
                  <div className="mb-6">
                    {answerResult.isCorrect ? (
                      <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Correct Answer! Well done!
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Incorrect Answer
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      Your Score: <span className="text-blue-600">{score}</span>
                    </h3>
                    {answerResult.isCorrect && (
                      <p className="text-green-600 font-medium">
                        +{answerResult.pointsEarned} points earned
                      </p>
                    )}
                    {streak > 1 && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 717 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                          </svg>
                          {streak}x Streak!
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg mb-6 flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Time's up! No answer submitted.
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium">
                  Waiting for the next question...
                </p>
              </div>

              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" role="status">
                <span className="sr-only">Loading...</span>
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
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
      >
        <div className="max-w-7xl mx-auto px-4">

        <div className="max-w-4xl mx-auto">
          {/* Current Question */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div 
              className="bg-blue-600 text-white rounded-t-lg px-6 py-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Question {currentQuestionIndex + 1}</h4>
                <div className="text-right">
                  <div className="text-2xl font-bold">{timeLeft}s</div>
                </div>
              </div>
              <div className="mt-3 bg-white bg-opacity-20 rounded-full h-2">
                <div
                  className="bg-blue-300 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${(timeLeft / (currentQuestion.timeLimit || 30)) * 100}%`
                  }}
                ></div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-center mb-6">{currentQuestion.question}</h3>

              {/* Answer Options - Student View (With interaction) */}
              <div className="student-view grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {currentQuestion?.options?.map((option, index) => (
                  <button
                    key={index}
                    className={`option-btn option-${index} w-full text-white ${hasAnswered ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => submitAnswer(index)}
                    disabled={hasAnswered}
                    style={{ 
                      minHeight: '96px',
                      backgroundColor: (
                        index === 0 ? '#ef4444' : // red-500
                        index === 1 ? '#3b82f6' : // blue-500  
                        index === 2 ? '#eab308' : // yellow-500
                        index === 3 ? '#22c55e' : // green-500
                        '#6b7280' // gray-500 fallback
                      )
                    }}
                  >
                    {option}
                  </button>
                )) || (
                  <div className="col-span-full text-center text-gray-500">
                    Loading options...
                  </div>
                )}
              </div>

              {/* Question Progress - Moved below options */}
              <div className="mb-6">
                <div className="max-w-4xl mx-auto">
                  {/* Step Progress Bar with Dots */}
                  <div className="flex items-center justify-center mb-3">
                    {Array.from({ length: totalQuestions }, (_, index) => (
                      <div key={index} className="flex items-center">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            index <= currentQuestionIndex 
                              ? 'bg-blue-600'   // Current and completed questions - blue
                              : 'bg-gray-300'   // Future questions - gray
                          } transition-colors duration-300`}
                        />
                        {index < totalQuestions - 1 && (
                          <div 
                            className={`w-8 h-0.5 mx-1 ${
                              index < currentQuestionIndex 
                                ? 'bg-blue-600' 
                                : 'bg-gray-300'
                            } transition-colors duration-300`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-gray-600 text-sm">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </p>
                </div>
              </div>

              {/* Score display at bottom */}
              {currentQuestionIndex > 0 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-lg font-semibold text-gray-900">
                    Current Score: <span className="text-blue-600">{score}</span>
                  </div>
                  {streak > 1 && (
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 717 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                        {streak}x Streak!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </Layout>
    );
  }

  // If on question route but no question data yet, show loading
  if (isQuestionRoute && !currentQuestion) {
    return (
      <Layout 
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
      >
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-4 text-gray-600">Loading question...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Loading/validation state
  return (
    <Layout 
      title={roomInfo?.quizName || "Quiz Room"}
      subtitle={`Room ID: ${roomId}`}
    >
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    </Layout>
  );
}
