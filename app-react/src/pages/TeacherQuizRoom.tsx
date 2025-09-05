import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizEnded, setQuizEnded] = useState(false);

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

      socket.on('new_question', handleNewQuestion);
      socket.on('player_answered', handlePlayerAnswered);
      socket.on('question_ended', handleQuestionEnded);
      socket.on('player_joined', handlePlayerJoined);
      socket.on('player_left', handlePlayerLeft);
      socket.on('quiz_ended', handleQuizCompleted);
      socket.on('room_error', handleRoomError);
      socket.on('join_error', handleJoinError);

      return () => {
        socket.off('new_question', handleNewQuestion);
        socket.off('player_answered', handlePlayerAnswered);
        socket.off('question_ended', handleQuestionEnded);
        socket.off('player_joined', handlePlayerJoined);
        socket.off('player_left', handlePlayerLeft);
        socket.off('quiz_ended', handleQuizCompleted);
        socket.off('room_error', handleRoomError);
        socket.off('join_error', handleJoinError);
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
  }, [socket, roomId, teacherId, isAuthenticated, navigate, questionId, isQuestionRoute, isResultRoute, isFinalRoute]);

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
      <Layout 
        title="Quiz Room"
        subtitle="Loading quiz..."
        showLogout={true}
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
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
        title={`Question ${questionId} Results`}
        subtitle="Review student answers and continue to next question"
        showLogout={true}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="bg-green-600 text-white rounded-t-lg px-6 py-4">
                <h4 className="text-xl font-semibold mb-0 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Question {questionId} Results
                </h4>
              </div>
              <div className="p-6">
              {questionResults && questionResults.question && questionResults.options ? (
                <div>
                  {/* Question Display */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-semibold mb-4">{questionResults.question}</h3>
                  </div>

                  {/* Answer Options with Correct Answer Highlighted - 2x2 Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                              padding: '12px'
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

                  {/* Player Results Table */}
                  {questionResults.playerAnswers.length > 0 && (
                    <div className="mt-6">
                      <h5 className="text-lg font-semibold mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Student Results ({questionResults.playerAnswers.length} students)
                      </h5>
                      <div className="overflow-x-auto">
                        <table className="w-full bg-white rounded-lg overflow-hidden border border-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Their Answer</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {questionResults.playerAnswers
                              .sort((a, b) => b.score - a.score) // Sort by score descending
                              .map((answer, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="font-semibold text-gray-900">{answer.playerName}</div>
                                    {answer.studentId && (
                                      <div className="text-sm text-gray-500">ID: {answer.studentId}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {answer.answerId !== null ? (
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      Option {answer.answerId + 1}
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">No answer</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {answer.isCorrect ? (
                                    <span className="text-green-600 font-semibold flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      Correct
                                    </span>
                                  ) : (
                                    <span className="text-red-600 font-semibold flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Wrong
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <span className="font-semibold text-blue-600">{answer.score} pts</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
              
              <div className="text-center mt-6">
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
                  <button 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center"
                    onClick={backToDashboard}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m0 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10M9 21h6" />
                    </svg>
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout 
        title="Quiz Room Error"
        subtitle="There was an error accessing the quiz room"
        showLogout={true}
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
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
        title="Quiz Complete"
        subtitle="View final rankings and download results"
        showLogout={true}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quiz has ended successfully! Results have been saved to history.
              </div>

              {quizRankings && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-900">{quizRankings.quizName}</h4>
                  <p className="text-gray-600">
                    {new Date(quizRankings.dateCompleted).toLocaleDateString()} {new Date(quizRankings.dateCompleted).toLocaleTimeString()} •{' '}
                    {quizRankings.playerCount} players
                  </p>
                </div>
              )}

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
                        {quizRankings.rankings.map((player, index) => (
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
        </div>
      </Layout>
    );
  }

  if (!currentQuestion) {
    return (
      <Layout 
        title="Ready to Start Quiz"
        subtitle={`Room ID: ${roomId} • Students are ready`}
        showLogout={true}
      >
        <div className="max-w-7xl mx-auto px-4">
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
      title={`Question ${currentQuestion?.currentQuestionIndex ? currentQuestion.currentQuestionIndex + 1 : 1}`}
      subtitle={`Room ID: ${roomId} • ${timeRemaining}s remaining`}
      showLogout={true}
    >
      <div className="max-w-7xl mx-auto px-4">

      {/* Question Progress */}
      <div className="mb-6">
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
      </div>

      <div className="max-w-4xl mx-auto">
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
            <h3 className="text-xl font-semibold text-center mb-6">{currentQuestion.question}</h3>

            {/* Answer Options - Teacher View (No interaction) */}
            <div className="teacher-view grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

            {/* Question Controls */}
            <div className="mt-6">
              {!questionResults ? (
                <div className="text-center py-4">
                  {/* No loading indicator needed */}
                </div>
              ) : (
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
      </div>
    </Layout>
  );
};

export default TeacherQuizRoom;
