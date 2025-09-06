import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';
import { useAuth } from '../hooks/useAuth.js';
import type { QuestionResults } from '../types/quiz.ts';
import Layout from '../components/Layout';

interface QuestionData {
  question: string;
  options: string[];
  timeLimit: number;
  remainingTime: number;
  questionId: number;
  currentQuestionIndex: number;
  totalQuestions: number;
}

interface QuizRankings {
  id: string;
  roomId: string;
  quizId: string;
  quizName: string;
  dateCompleted: string;
  playerCount: number;
  rankings: Array<{
    rank: number;
    playerId: string;
    playerName: string;
    studentId: string;
    score: number;
  }>;
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

const TeacherQuizRoom = () => {
  const { roomId, questionId } = useParams<{ roomId: string; questionId?: string }>();
  const { socket } = useSocket();
  const { teacherId, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionResults, setQuestionResults] = useState<QuestionResults | null>(null);
  const [quizRankings, setQuizRankings] = useState<QuizRankings | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizEnded, setQuizEnded] = useState(false);
  const [showEndQuizModal, setShowEndQuizModal] = useState(false);

  // Get current route state
  const isQuestionRoute = location.pathname.includes('/question/');
  const isResultRoute = location.pathname.includes('/result/');
  const isFinalRoute = location.pathname.includes('/final');

  console.log('TeacherQuizRoom render:', { 
    roomId, 
    questionId, 
    route: location.pathname, 
    isQuestionRoute, 
    isResultRoute, 
    isFinalRoute,
    socket: !!socket, 
    currentQuestion: !!currentQuestion 
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/teacher/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Rejoin room as teacher function - moved outside useEffect to make it accessible
  const rejoinTeacherRoom = useCallback(() => {
    if (!socket || !roomId) return;
    console.log('Teacher rejoining quiz room:', { roomId, teacherId });
    socket.emit('join_teacher_room', {
      roomId,
      teacherId: teacherId || 'unknown'
    });
    
    // Also request room info to get quiz name
    socket.emit('get_room_info', { roomId });
  }, [socket, roomId, teacherId]);

  useEffect(() => {
    if (!socket || !roomId || !isAuthenticated) {
      console.log('Missing requirements:', { socket: !!socket, roomId, isAuthenticated });
      return;
    }

    // Handle URL state for refresh scenarios
    if (isResultRoute && questionId) {
      console.log('Result route detected on refresh, setting up result view...');
      
      // Try to load question results from localStorage
      const storedResults = localStorage.getItem(`questionResults_${roomId}_${questionId}`);
      if (storedResults) {
        try {
          const parsedResults = JSON.parse(storedResults);
          console.log('Loaded question results from localStorage:', parsedResults);
          setQuestionResults(parsedResults);
        } catch (e) {
          console.error('Failed to parse stored question results:', e);
        }
      }
      
      if (!storedResults) {
        // On result page refresh without stored data, create minimal state
        setQuestionResults({
          questionId: parseInt(questionId),
          correctAnswer: 0, // Unknown on refresh
          currentQuestionIndex: 0, // Unknown on refresh
          totalQuestions: 0, // Unknown on refresh
          playerAnswers: [] // Empty on refresh
        });
      }
      setLoading(false);
    } else if (isQuestionRoute && questionId) {
      console.log('Question route detected on refresh, setting up question view...');
      // On question page refresh, create mock question data
      setCurrentQuestion({
        questionId: parseInt(questionId),
        question: 'Question content unavailable after refresh',
        options: ['Refresh detected - please use Next Question to continue'],
        timeLimit: 0,
        remainingTime: 0,
        currentQuestionIndex: 0,
        totalQuestions: 0
      });
      setTimeRemaining(0);
      setLoading(false);
    } else if (isFinalRoute) {
      console.log('Final route detected on refresh...');
      setLoading(false);
      setQuizEnded(true);
      
      // Try to load quiz rankings for the final page
      fetch(`/api/quiz-history/${roomId}`)
        .then(response => response.json())
        .then((quizData: QuizRankings) => {
          console.log('Loaded quiz rankings on refresh:', quizData);
          setQuizRankings(quizData);
        })
        .catch(error => {
          console.error('Error loading quiz rankings on refresh:', error);
        });
    } else {
      console.log('Unknown route state, staying in loading...');
    }

    const setupEventListeners = () => {
      // Handle room info
      const handleRoomInfo = (data: RoomInfo) => {
        console.log('Received room info:', data);
        setRoomInfo(data);
      };

      // Handle new question started
      const handleNewQuestion = (data: QuestionData) => {
        console.log('New question started:', data);
        setCurrentQuestion(data);
        setTimeRemaining(data.remainingTime || data.timeLimit);
        setQuestionResults(null);
        setLoading(false);
        
        // Navigate to question route
        navigate(`/teacher/room/${roomId}/question/${data.questionId}`);
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
        
        // Store results in localStorage for refresh persistence
        localStorage.setItem(`questionResults_${roomId}_${data.questionId}`, JSON.stringify(data));
        
        // Navigate to result route
        navigate(`/teacher/room/${roomId}/result/${data.questionId}`);
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
        
        // If we have a historyId, fetch the final rankings
        if (data.historyId) {
          fetch(`/api/quiz-history/${data.historyId}`)
            .then(response => response.json())
            .then((quizData: QuizRankings) => {
              console.log('Loaded quiz rankings:', quizData);
              setQuizRankings(quizData);
            })
            .catch(error => {
              console.error('Error loading quiz rankings:', error);
            });
        }
        
        // Navigate to final results
        navigate(`/teacher/room/${roomId}/final`);
      };

      // Handle teacher joined completed room
      const handleTeacherJoinedCompletedRoom = (data: { roomId: string; isCompleted: boolean; historyId: string }) => {
        console.log('Teacher joined completed room:', data);
        setQuizEnded(true);
        
        // Fetch the final rankings from history
        fetch(`/api/quiz-history/${data.historyId}`)
          .then(response => response.json())
          .then((quizData: QuizRankings) => {
            console.log('Loaded quiz rankings from completed room:', quizData);
            setQuizRankings(quizData);
            setLoading(false);
          })
          .catch(error => {
            console.error('Error loading quiz rankings from completed room:', error);
            setError('Failed to load quiz results');
            setLoading(false);
          });
      };

      // Handle room errors
      const handleRoomError = (message: string) => {
        console.error('Room error:', message);
        setError(message);
        setLoading(false);
      };

      // Handle join errors (room not found)
      const handleJoinError = (message: string) => {
        console.error('Join error:', message);
        if (message.includes('Room not found') || message.includes('Room does not exist')) {
          // Redirect teacher to dashboard if room doesn't exist
          navigate('/teacher/dashboard');
          return;
        }
        setError(message);
        setLoading(false);
      };

      // Handle next question errors
      const handleNextError = (message: string) => {
        console.error('Next question error:', message);
        // Try to rejoin teacher room if there's an authorization issue
        if (message.includes('Not authorized')) {
          console.log('Authorization issue, attempting to rejoin teacher room...');
          rejoinTeacherRoom();
        }
        setError(`Error advancing to next question: ${message}`);
      };

      socket.on('room_info', handleRoomInfo);
      socket.on('new_question', handleNewQuestion);
      socket.on('player_answered', handlePlayerAnswered);
      socket.on('question_ended', handleQuestionEnded);
      socket.on('player_joined', handlePlayerJoined);
      socket.on('player_left', handlePlayerLeft);
      socket.on('quiz_ended', handleQuizCompleted);
      socket.on('teacher_joined_completed_room', handleTeacherJoinedCompletedRoom);
      socket.on('room_error', handleRoomError);
      socket.on('join_error', handleJoinError);
      socket.on('next_error', handleNextError);

      return () => {
        socket.off('room_info', handleRoomInfo);
        socket.off('new_question', handleNewQuestion);
        socket.off('player_answered', handlePlayerAnswered);
        socket.off('question_ended', handleQuestionEnded);
        socket.off('player_joined', handlePlayerJoined);
        socket.off('player_left', handlePlayerLeft);
        socket.off('quiz_ended', handleQuizCompleted);
        socket.off('teacher_joined_completed_room', handleTeacherJoinedCompletedRoom);
        socket.off('room_error', handleRoomError);
        socket.off('join_error', handleJoinError);
        socket.off('next_error', handleNextError);
      };
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
  }, [socket, roomId, teacherId, isAuthenticated, navigate, questionId, isQuestionRoute, isResultRoute, isFinalRoute, rejoinTeacherRoom]);

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
    if (!socket || !roomId) {
      console.error('Cannot advance question: missing socket or roomId');
      return;
    }
    
    console.log('Attempting to advance to next question for room:', roomId);
    console.log('Socket connected:', socket.connected);
    console.log('Socket ID:', socket.id);
    
    // Clear any previous errors
    setError(null);
    
    // Check if this is the last question
    const isLastQuestion = currentQuestion && 
      (currentQuestion.currentQuestionIndex + 1) >= currentQuestion.totalQuestions;
    
    if (isLastQuestion) {
      console.log('Last question completed, ending quiz for room:', roomId);
      // End the quiz which will trigger quiz_ended event
      socket.emit('next_question', roomId); // Server will detect end and emit quiz_ended
    } else {
      console.log('Moving to next question for room:', roomId);
      socket.emit('next_question', roomId);
    }
  };

  const endQuiz = () => {
    setShowEndQuizModal(true);
  };

  const handleEndQuizConfirm = () => {
    if (!socket || !roomId) return;
    
    console.log('Ending quiz for room:', roomId);
    // Delete the room to end the quiz - this will redirect students to join page
    socket.emit('delete_room', { roomId });
    // Navigate teacher to dashboard
    navigate('/teacher/dashboard');
  };

  const handleEndQuizCancel = () => {
    setShowEndQuizModal(false);
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
      <Layout 
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
        showLogout={true}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-4 text-gray-600">
              {!socket ? 'Connecting...' : 
               !socket.connected ? 'Connecting to quiz room...' : 
               'Loading quiz...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle result route refresh - show result view even without full data
  if (isResultRoute && questionId) {
    return (
      <Layout 
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
        showLogout={true}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Question Display and Answer Options - Combined div */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              {questionResults && questionResults.question && questionResults.options ? (
                <div>
                  {/* Question Display */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-semibold mb-4">{questionResults.question}</h3>
                  </div>

                  {/* Answer Options with Correct Answer Highlighted - 2x2 Grid */}
                  <div className="teacher-view grid grid-cols-1 md:grid-cols-2 gap-4">
                    {questionResults.options.map((option: string, index: number) => {
                      const isCorrect = index === questionResults.correctAnswer;
                      
                      return (
                        <div key={index}>
                          <div
                            className={`option-btn option-${index} w-full text-white flex items-center justify-center ${isCorrect ? 'correct-answer' : ''}`}
                            style={{ 
                              cursor: 'default',
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
                            {isCorrect && (
                              <span className="mr-2">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </span>
                            )}
                            <span className="text-center">{option}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <h5 className="text-lg font-semibold text-gray-900 mb-2">Page Refreshed</h5>
                  <p className="text-gray-600 mb-2">Question results data is not available after page refresh.</p>
                  <p className="text-gray-600">The quiz is still active. Use "Next Question" to continue.</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar - Separate div */}
          {questionResults && questionResults.currentQuestionIndex !== undefined && questionResults.totalQuestions !== undefined && (
            <div className="bg-white rounded-lg border border-gray-200 mt-6">
              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  {/* Step Progress Bar with Dots */}
                  <div className="flex items-center justify-center mb-3">
                    {Array.from({ length: questionResults.totalQuestions }, (_, index) => (
                      <div key={index} className="flex items-center">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            index <= questionResults.currentQuestionIndex 
                              ? 'bg-blue-600'   // Current and completed questions - blue
                              : 'bg-gray-300'   // Future questions - gray
                          } transition-colors duration-300`}
                        />
                        {index < questionResults.totalQuestions - 1 && (
                          <div 
                            className={`w-8 h-0.5 mx-1 ${
                              index < questionResults.currentQuestionIndex 
                                ? 'bg-blue-600' 
                                : 'bg-gray-300'
                            } transition-colors duration-300`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-gray-600 text-sm">
                    Question {questionResults.currentQuestionIndex + 1} of {questionResults.totalQuestions}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Answer Distribution - Separate div */}
          {questionResults && questionResults.playerAnswers.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 mt-6">
              <div className="p-6">
                <h5 className="text-lg font-semibold mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Answer Distribution ({questionResults.playerAnswers.length} students)
                </h5>
                <div className="space-y-4">
                  {questionResults.options && questionResults.options.map((option: string, index: number) => {
                    // Count how many students chose this option
                    const optionCount = questionResults.playerAnswers.filter(answer => answer.answerId === index).length;
                    const totalAnswers = questionResults.playerAnswers.length;
                    const percentage = totalAnswers > 0 ? (optionCount / totalAnswers) * 100 : 0;
                    const isCorrect = index === questionResults.correctAnswer;
                    
                    // Define colors for each option
                    const colors = {
                      0: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
                      1: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
                      2: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-100' },
                      3: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' }
                    };
                    const colorSet = colors[index as keyof typeof colors] || { bg: 'bg-gray-500', text: 'text-gray-700', light: 'bg-gray-100' };
                    
                    return (
                      <div key={index} className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${colorSet.bg} text-white text-sm font-semibold mr-3`}>
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{option}</span>
                            {isCorrect && (
                              <svg className="w-5 h-5 text-green-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center">
                            <span className={`text-sm font-semibold ${colorSet.text} mr-2`}>
                              {optionCount} student{optionCount !== 1 ? 's' : ''}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${colorSet.bg} transition-all duration-500 ease-out`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Show "No Answer" if there are any */}
                  {(() => {
                    const noAnswerCount = questionResults.playerAnswers.filter(answer => answer.answerId === null).length;
                    if (noAnswerCount > 0) {
                      const totalAnswers = questionResults.playerAnswers.length;
                      const percentage = (noAnswerCount / totalAnswers) * 100;
                      return (
                        <div className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 text-white text-sm font-semibold mr-3">
                                ⏱
                              </span>
                              <span className="font-medium text-gray-900">No Answer</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-semibold text-gray-700 mr-2">
                                {noAnswerCount} student{noAnswerCount !== 1 ? 's' : ''}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="h-3 rounded-full bg-gray-500 transition-all duration-500 ease-out"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Separate div */}
          <div className="bg-white rounded-lg border border-gray-200 mt-6">
            <div className="p-6">
              <div className="text-center">
                <div className="flex flex-wrap gap-3 justify-center">
                  <button 
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center"
                    onClick={nextQuestion}
                  >
                    <svg className={`w-5 h-5 mr-2 ${
                      questionResults && 
                      questionResults.currentQuestionIndex !== undefined && 
                      questionResults.totalQuestions !== undefined &&
                      (questionResults.currentQuestionIndex + 1) >= questionResults.totalQuestions
                        ? '' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {questionResults && 
                       questionResults.currentQuestionIndex !== undefined && 
                       questionResults.totalQuestions !== undefined &&
                       (questionResults.currentQuestionIndex + 1) >= questionResults.totalQuestions ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      )}
                    </svg>
                    {questionResults && 
                     questionResults.currentQuestionIndex !== undefined && 
                     questionResults.totalQuestions !== undefined &&
                     (questionResults.currentQuestionIndex + 1) >= questionResults.totalQuestions
                      ? 'Finalize Quiz' : 'Next Question'}
                  </button>
                  <button 
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center"
                    onClick={endQuiz}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    End Quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* End Quiz Confirmation Modal */}
        {showEndQuizModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
            onClick={handleEndQuizCancel}
          >
            <div className="bg-white rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-red-600 text-white rounded-t-lg px-6 py-4 flex items-center justify-between">
                <h5 className="text-lg font-semibold flex items-center mb-0">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  End Quiz
                </h5>
                <button
                  type="button"
                  className="text-white hover:text-gray-200 transition-colors"
                  onClick={handleEndQuizCancel}
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <div className="mb-4">
                    <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </div>
                  <h6 className="text-lg font-medium mb-4">Are you sure you want to end the quiz?</h6>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-600 mb-1">Room ID:</div>
                    <div className="text-red-700 font-semibold">{roomId}</div>
                  </div>
                  <p className="text-gray-500 text-sm mb-0">
                    This will permanently end the quiz and disconnect all students. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 flex justify-center">
                <button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                  onClick={handleEndQuizConfirm}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span>End Quiz & Return to Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout 
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
        showLogout={true}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{error}</span>
            </div>
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 mt-3"
              onClick={() => navigate('/teacher/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (quizEnded) {
    return (
      <Layout 
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
        showLogout={true}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Final Rankings</h4>
                {quizRankings && quizRankings.rankings.length > 0 ? (
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full bg-white rounded-lg overflow-hidden border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {quizRankings.rankings.slice(0, 10).map((player, index) => (
                          <tr key={index} className={`
                            ${index === 0 ? 'bg-yellow-50' : // Gold for 1st place
                            index === 1 ? 'bg-gray-50' : // Silver for 2nd place  
                            index === 2 ? 'bg-orange-50' : 'hover:bg-gray-50'} // Bronze for 3rd place
                          `}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="font-semibold">#{player.rank}</span>
                                {index === 0 && <svg className="w-5 h-5 text-yellow-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8zM8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 4a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                </svg>}
                                {index === 1 && <svg className="w-5 h-5 text-gray-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8z" clipRule="evenodd" />
                                </svg>}
                                {index === 2 && <svg className="w-5 h-5 text-orange-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8z" clipRule="evenodd" />
                                </svg>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="font-semibold text-gray-900">{player.playerName}</div>
                                {player.studentId && (
                                  <div className="text-sm text-gray-500">ID: {player.studentId}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-semibold text-blue-600">{player.score} pts</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {quizRankings ? 'No students participated in this quiz.' : 'Loading rankings...'}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                    onClick={() => navigate('/teacher/dashboard')}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Start New Quiz
                  </button>
                  {quizRankings && (
                    <button
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                      onClick={() => {
                        // Create CSV content
                        const csvContent = [
                          ['Rank', 'Player Name', 'Student ID', 'Score'],
                          ...quizRankings.rankings.map(player => [
                            player.rank,
                            player.playerName,
                            player.studentId || 'N/A',
                            player.score
                          ])
                        ].map(row => row.join(',')).join('\n');
                        
                        // Download CSV
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `quiz-results-${quizRankings.roomId}.csv`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download CSV
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentQuestion) {
    return (
      <Layout 
        title={roomInfo?.quizName || "Quiz Room"}
        subtitle={`Room ID: ${roomId}`}
        showLogout={true}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-8 text-center">
            <div className="mb-6">
              <svg className="w-24 h-24 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Start Quiz</h3>
            <p className="text-gray-600 mb-2">Room ID: <span className="font-semibold">{roomId}</span></p>
            <p className="text-gray-600 mb-6">Students are waiting for you to begin...</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center justify-center"
                onClick={startQuiz}
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Quiz
              </button>
              <button 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                onClick={backToDashboard}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={roomInfo?.quizName || "Quiz Room"}
      subtitle={`Room ID: ${roomId}`}
      showLogout={true}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Current Question */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div 
            className="bg-blue-600 text-white rounded-t-lg px-6 py-4"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold">Question {currentQuestion.currentQuestionIndex + 1}</h4>
              <div className="text-right">
                <div className="text-2xl font-bold">{timeRemaining}s</div>
              </div>
            </div>
            <div className="mt-3 bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-blue-300 h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${(timeRemaining / currentQuestion.timeLimit) * 100}%`
                }}
              ></div>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-2xl font-semibold text-center mb-6">{currentQuestion.question}</h3>

            {/* Answer Options - Teacher View (No interaction) */}
            <div className="teacher-view grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                currentQuestion.options.map((option, index) => {
                  const isCorrect = questionResults && index === questionResults.correctAnswer;
                  
                  return (
                    <div key={index}>
                      <div
                        className={`option-btn option-${index} w-full text-white ${isCorrect ? 'correct-answer' : ''}`}
                        style={{ 
                          cursor: 'default',
                          minHeight: '96px',
                          backgroundColor: !isCorrect ? (
                            index === 0 ? '#ef4444' : // red-500
                            index === 1 ? '#3b82f6' : // blue-500  
                            index === 2 ? '#eab308' : // yellow-500
                            index === 3 ? '#22c55e' : // green-500
                            '#6b7280' // gray-500 fallback
                          ) : undefined
                        }}
                      >
                        {isCorrect && (
                          <span className="mr-2">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                        {option}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-gray-500">Loading options...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question Progress - Separate div */}
        <div className="bg-white rounded-lg border border-gray-200 mt-6">
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              {/* Step Progress Bar with Dots */}
              <div className="flex items-center justify-center mb-3">
                {Array.from({ length: currentQuestion.totalQuestions }, (_, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className={`w-3 h-3 rounded-full ${
                        index <= currentQuestion.currentQuestionIndex 
                          ? 'bg-blue-600'   // Current and completed questions - blue
                          : 'bg-gray-300'   // Future questions - gray
                      } transition-colors duration-300`}
                    />
                    {index < currentQuestion.totalQuestions - 1 && (
                      <div 
                        className={`w-8 h-0.5 mx-1 ${
                          index < currentQuestion.currentQuestionIndex 
                            ? 'bg-blue-600' 
                            : 'bg-gray-300'
                        } transition-colors duration-300`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-600 text-sm">
                Question {currentQuestion.currentQuestionIndex + 1} of {currentQuestion.totalQuestions}
              </p>
            </div>

            {/* Question Controls */}
            <div className="mt-6">
              {questionResults && (
                <div className="w-full">
                  {currentQuestion.currentQuestionIndex + 1 < currentQuestion.totalQuestions ? (
                    <button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center justify-center"
                      onClick={nextQuestion}
                    >
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Next Question
                    </button>
                  ) : (
                    <button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center justify-center"
                      onClick={nextQuestion}
                    >
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Finalize Quiz
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* End Quiz Confirmation Modal */}
      {showEndQuizModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
          onClick={handleEndQuizCancel}
        >
          <div className="bg-white rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-red-600 text-white rounded-t-lg px-6 py-4 flex items-center justify-between">
              <h5 className="text-lg font-semibold flex items-center mb-0">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                End Quiz
              </h5>
              <button
                type="button"
                className="text-white hover:text-gray-200 transition-colors"
                onClick={handleEndQuizCancel}
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </div>
                <h6 className="text-lg font-medium mb-4">Are you sure you want to end the quiz?</h6>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-1">Room ID:</div>
                  <div className="text-red-700 font-semibold">{roomId}</div>
                </div>
                <p className="text-gray-500 text-sm mb-0">
                  This will permanently end the quiz and disconnect all students. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-center">
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                onClick={handleEndQuizConfirm}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span>End Quiz & Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TeacherQuizRoom;
