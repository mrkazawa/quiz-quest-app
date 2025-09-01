import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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

  // Handle result route refresh - show result view even without full data
  if (isResultRoute && questionId) {
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

        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h4 className="mb-0">
                  <i className="bi bi-bar-chart-fill me-2"></i>
                  Question {questionId} Results
                </h4>
              </div>
              <div className="card-body">
                {questionResults && questionResults.question && questionResults.options ? (
                  <div>
                    {/* Question Display */}
                    <div className="text-center mb-4">
                      <h3 className="mb-4">{questionResults.question}</h3>
                    </div>

                    {/* Answer Options with Correct Answer Highlighted - 2x2 Grid */}
                    <div className="row mb-4">
                      {questionResults.options.map((option: string, index: number) => {
                        const isCorrect = index === questionResults.correctAnswer;
                        
                        return (
                          <div key={index} className="col-6 mb-3">
                            <div
                              className={`option-btn option-${index} btn w-100 text-white d-flex align-items-center justify-content-center ${isCorrect ? 'correct-answer' : ''}`}
                              style={{ 
                                cursor: 'default',
                                height: '100px',
                                fontSize: '1.1rem',
                                padding: '12px'
                              }}
                            >
                              {isCorrect && (
                                <span className="correct-indicator me-2">
                                  <i className="bi bi-check-circle-fill" style={{ fontSize: '1.5rem', color: '#ffffff' }}></i>
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
                      <div className="mt-4">
                        <h5 className="mb-3">
                          <i className="bi bi-people-fill me-2"></i>
                          Student Results ({questionResults.playerAnswers.length} students)
                        </h5>
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead className="table-light">
                              <tr>
                                <th scope="col">Student</th>
                                <th scope="col">Their Answer</th>
                                <th scope="col">Result</th>
                                <th scope="col" className="text-end">Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {questionResults.playerAnswers
                                .sort((a, b) => b.score - a.score) // Sort by score descending
                                .map((answer, index) => (
                                <tr key={index}>
                                  <td>
                                    <div>
                                      <strong>{answer.playerName}</strong>
                                      {answer.studentId && (
                                        <div className="text-muted small">ID: {answer.studentId}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td>
                                    {answer.answerId !== null ? (
                                      <span className={`badge ${answer.isCorrect ? 'bg-success' : 'bg-danger'} fs-6`}>
                                        Option {answer.answerId + 1}
                                      </span>
                                    ) : (
                                      <span className="badge bg-secondary fs-6">No answer</span>
                                    )}
                                  </td>
                                  <td>
                                    {answer.isCorrect ? (
                                      <span className="text-success fw-semibold">
                                        <i className="bi bi-check-circle-fill me-1"></i>
                                        Correct
                                      </span>
                                    ) : (
                                      <span className="text-danger fw-semibold">
                                        <i className="bi bi-x-circle-fill me-1"></i>
                                        Wrong
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-end">
                                    <strong className="text-primary">{answer.score} pts</strong>
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
                  <div className="text-center py-4">
                    <i className="bi bi-arrow-clockwise display-4 text-info mb-3"></i>
                    <h5>Page Refreshed</h5>
                    <p className="text-muted">Question results data is not available after page refresh.</p>
                    <p className="text-muted">The quiz is still active. Use "Next Question" to continue.</p>
                  </div>
                )}
                
                <div className="text-center mt-4">
                  <div className="d-flex gap-3 justify-content-center">
                    <button 
                      className="btn btn-success btn-lg px-4"
                      onClick={nextQuestion}
                    >
                      <i className={`bi ${
                        questionResults && 
                        questionResults.currentQuestionIndex !== undefined && 
                        questionResults.totalQuestions !== undefined &&
                        (questionResults.currentQuestionIndex + 1) >= questionResults.totalQuestions
                          ? 'bi-trophy' : 'bi-arrow-right'
                      } me-2`}></i>
                      {questionResults && 
                       questionResults.currentQuestionIndex !== undefined && 
                       questionResults.totalQuestions !== undefined &&
                       (questionResults.currentQuestionIndex + 1) >= questionResults.totalQuestions
                        ? 'Finalize Quiz' : 'Next Question'}
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={endQuiz}
                    >
                      <i className="bi bi-stop-fill me-2"></i>
                      End Quiz
                    </button>
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={backToDashboard}
                    >
                      <i className="bi bi-house me-2"></i>
                      Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div className="card">
              <div className="card-body">
                <div className="alert alert-success mb-4">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Quiz has ended successfully! Results have been saved to history.
                </div>

                {quizRankings && (
                  <div className="mb-3">
                    <h4>{quizRankings.quizName}</h4>
                    <p className="text-muted">
                      {new Date(quizRankings.dateCompleted).toLocaleDateString()} {new Date(quizRankings.dateCompleted).toLocaleTimeString()} •{' '}
                      {quizRankings.playerCount} players
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <h4>Final Rankings</h4>
                  {quizRankings && quizRankings.rankings.length > 0 ? (
                    <div className="table-responsive mb-3">
                      <table className="table ranking-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quizRankings.rankings.map((player, index) => (
                            <tr key={index} className={
                              index === 0 ? 'table-warning' : // Gold for 1st place
                              index === 1 ? 'table-secondary' : // Silver for 2nd place  
                              index === 2 ? 'table-warning' : '' // Bronze for 3rd place
                            }>
                              <td>
                                <strong>#{player.rank}</strong>
                                {index === 0 && <i className="bi bi-trophy-fill text-warning ms-2"></i>}
                                {index === 1 && <i className="bi bi-award-fill text-secondary ms-2"></i>}
                                {index === 2 && <i className="bi bi-award-fill text-warning ms-2"></i>}
                              </td>
                              <td>
                                <strong>{player.playerName}</strong>
                                {player.studentId && (
                                  <small className="d-block text-muted">ID: {player.studentId}</small>
                                )}
                              </td>
                              <td>
                                <strong className="text-primary">{player.score} pts</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      {quizRankings ? 'No students participated in this quiz.' : 'Loading rankings...'}
                    </div>
                  )}
                  
                  <div className="d-flex" style={{ width: '100%' }}>
                    <button 
                      className="btn btn-lg btn-primary flex-grow-1 me-2"
                      onClick={() => navigate('/teacher/dashboard')}
                      style={{
                        minWidth: 0,
                        flexBasis: 0,
                        flexShrink: 1,
                        flexGrow: 3
                      }}
                    >
                      <i className="bi bi-arrow-repeat me-2"></i>
                      Start New Quiz
                    </button>
                    {quizRankings && (
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        style={{
                          whiteSpace: 'nowrap',
                          flexBasis: 0,
                          flexShrink: 1,
                          flexGrow: 1,
                          minWidth: '120px'
                        }}
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
                        <i className="bi bi-download me-2"></i>
                        Download CSV
                      </button>
                    )}
                  </div>
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
                        onClick={nextQuestion}
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
