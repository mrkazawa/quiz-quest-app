import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.ts';
import type { NewQuestionData } from '../types/socket.ts';
import type { QuestionResults, PlayerAnswer } from '../types/quiz.ts';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
  selectedAnswer: number | null;
  selectedAnswerText: string;
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
  const [questionStartScore, setQuestionStartScore] = useState<number>(0);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [sessionValid, setSessionValid] = useState<boolean>(false);
  const [waitingForNext, setWaitingForNext] = useState<boolean>(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [studentRanking, setStudentRanking] = useState<{rank: number, totalPlayers: number} | null>(null);
  const [loadingRanking, setLoadingRanking] = useState(true);

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

    // Skip session validation for final route since quiz has ended
    if (isFinalRoute) {
      console.log('Final route - skipping session validation');
      return;
    }

    // Validate session first for other routes
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

      // Track score at start of question for points calculation
      setQuestionStartScore(serverScore || 0);

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
        // Calculate points earned this question
        const pointsEarned = (playerAnswer.score || 0) - questionStartScore;
        
        // Get selected answer text
        const selectedAnswerText = playerAnswer.answerId !== null && data.options 
          ? data.options[playerAnswer.answerId] 
          : 'No answer selected';
        
        setAnswerResult({
          isCorrect: playerAnswer.isCorrect,
          pointsEarned: pointsEarned,
          streak: playerAnswer.streak || 0,
          totalScore: playerAnswer.score || 0,
          selectedAnswer: playerAnswer.answerId,
          selectedAnswerText: selectedAnswerText,
        });
        
        // Update scores and streak
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
      
      // Save final data to session for final page
      const finalData = {
        finalScore: score,
        historyId: data.historyId,
        roomId: roomId,
        quizName: roomInfo?.quizName
      };
      localStorage.setItem('finalQuizData', JSON.stringify(finalData));
      
      // Navigate to final page instead of join page
      navigate(`/student/room/${roomId}/final`);
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
  }, [socket, roomId, navigate, questionId, saveSession, score, questionStartScore, roomInfo?.quizName]);

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

  // Fetch ranking data for final page
  useEffect(() => {
    if (isFinalRoute) {
      const fetchRanking = async () => {
        const finalData = localStorage.getItem('finalQuizData');
        const parsedFinalData = finalData ? JSON.parse(finalData) : null;
        
        if (parsedFinalData?.historyId) {
          try {
            const response = await fetch(`/api/quiz-history/${parsedFinalData.historyId}`);
            const historyData = await response.json();
            
            // Find current student's ranking
            const currentStudentId = getStoredSession()?.studentId;
            const currentPlayerName = getStoredSession()?.playerName;
            
            if (historyData.rankings && (currentStudentId || currentPlayerName)) {
              const playerRanking = historyData.rankings.find((ranking: { studentId: string; playerName: string; rank: number }) => 
                ranking.studentId === currentStudentId || ranking.playerName === currentPlayerName
              );
              
              if (playerRanking) {
                setStudentRanking({
                  rank: playerRanking.rank,
                  totalPlayers: historyData.rankings.length
                });
              }
            }
          } catch (error) {
            console.error('Error fetching ranking:', error);
          }
        }
        setLoadingRanking(false);
      };
      
      fetchRanking();
    } else {
      // Reset ranking state when not on final route
      setLoadingRanking(true);
      setStudentRanking(null);
    }
  }, [isFinalRoute]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header 
          title={roomInfo?.quizName || "Quiz Room"}
          subtitle={`Room ID: ${roomId}`} 
          showLogout={false} 
          showBack={false} 
          backTo="/"
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full max-w-2xl mx-4">
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

                  {/* Show selected answer */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 text-center">Your Answer:</h4>
                    <div className="flex items-center justify-center">
                      {answerResult.selectedAnswer !== null ? (
                        <>
                          {(() => {
                            // Define colors for each option (same as teacher quiz room)
                            const colors = {
                              0: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
                              1: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
                              2: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-100' },
                              3: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' }
                            };
                            const colorSet = colors[answerResult.selectedAnswer as keyof typeof colors] || { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-100' };
                            
                            return (
                              <>
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${colorSet.bg} text-white text-sm font-semibold mr-3`}>
                                  {answerResult.selectedAnswer + 1}
                                </span>
                                <span className="font-medium text-gray-900">{answerResult.selectedAnswerText}</span>
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <span className="text-gray-700">No answer selected</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      Your Score: <span className="text-blue-600">{score}</span>
                    </h3>
                    <p className="text-green-600 font-medium">
                      +{answerResult.pointsEarned} points earned
                    </p>
                    {answerResult.streak > 1 && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 717 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                          </svg>
                          {answerResult.streak}x Streak!
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

              {/* Loading circle first, then waiting message */}
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" role="status">
                <span className="sr-only">Loading...</span>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800 font-medium">
                  Waiting for the next question...
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Final Results Screen
  if (isFinalRoute) {
    // Get saved final data
    const finalData = localStorage.getItem('finalQuizData');
    const parsedFinalData = finalData ? JSON.parse(finalData) : null;
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header 
          title={parsedFinalData?.quizName || "Quiz Completed"}
          subtitle={`Room ID: ${roomId}`} 
          showLogout={false} 
          showBack={false} 
          backTo="/"
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-lg mx-4">
            <div className="text-center">
              {/* Success Message */}
              <div className="mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
                <p className="text-gray-600">Great job on completing the quiz.</p>
              </div>

              {/* Final Score */}
              <div className="mb-6 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Final Score</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {parsedFinalData?.finalScore || score} 
                  <span className="text-lg text-gray-500 ml-2">pts</span>
                </div>
              </div>

              {/* Ranking Information */}
              <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Ranking</h3>
                {loadingRanking ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                    <span className="ml-2 text-gray-600">Loading ranking...</span>
                  </div>
                ) : studentRanking ? (
                  <div>
                    <div className="text-3xl font-bold text-yellow-600 mb-1">
                      #{studentRanking.rank}
                    </div>
                    <p className="text-gray-600">
                      out of {studentRanking.totalPlayers} player{studentRanking.totalPlayers !== 1 ? 's' : ''}
                    </p>
                    {studentRanking.rank === 1 && (
                      <div className="mt-2">
                        <svg className="w-6 h-6 text-yellow-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-yellow-600">Winner!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">Ranking not available</p>
                )}
              </div>

              {/* Join Another Quiz Button */}
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                onClick={() => {
                  // Clear final data and navigate to join page
                  localStorage.removeItem('finalQuizData');
                  localStorage.removeItem('studentSession');
                  navigate('/student/join');
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Join Another Quiz
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

    // Question Screen
  if (isQuestionRoute && currentQuestion) {
    return (
      <Layout 
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Question Display and Answer Options - Combined div */}
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
              {/* Question Display */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold mb-4">{currentQuestion.question}</h3>
              </div>

              {/* Answer Options - Student View (With interaction) */}
              <div className="student-view grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion?.options?.map((option, index) => (
                  <button
                    key={index}
                    className={`option-btn option-${index} w-full text-white flex items-center justify-center ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                    onClick={() => submitAnswer(index)}
                    disabled={hasAnswered}
                    style={{ 
                      height: '100px',
                      fontSize: '1.1rem',
                      padding: '12px',
                      backgroundColor: (
                        index === 0 ? '#ef4444' : // red-500
                        index === 1 ? '#3b82f6' : // blue-500  
                        index === 2 ? '#eab308' : // yellow-500
                        index === 3 ? '#22c55e' : // green-500
                        '#6b7280' // gray-500 fallback
                      )
                    }}
                  >
                    <span className="text-center">{option}</span>
                  </button>
                )) || (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    Loading options...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quiz Progress - Separate div */}
          <div className="bg-white rounded-lg border border-gray-200 mt-6">
            <div className="p-6">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
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
