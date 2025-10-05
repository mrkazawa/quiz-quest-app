import gameHandlers from '../../../src/socket/handlers/gameHandlers';
import { mockSocket, mockServer, mockTeacherSocket, mockStudentSocket } from '../../helpers/mockSocket';
import RoomService from '../../../src/services/RoomService';
import QuizService from '../../../src/services/QuizService';
import HistoryService from '../../../src/services/HistoryService';
import { TypedSocket, TypedServer } from '../../../src/types/socket';

// Mock the services
jest.mock('../../../src/services/RoomService');
jest.mock('../../../src/services/QuizService');
jest.mock('../../../src/services/HistoryService');

describe('Game Handlers', () => {
  let socket: Partial<TypedSocket>;
  let io: Partial<TypedServer>;

  beforeEach(() => {
    socket = mockSocket();
    io = mockServer();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clear all timers to prevent worker process warnings
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('register', () => {
    it('should register game event listeners', () => {
      gameHandlers.register(socket as TypedSocket, io as TypedServer);

      expect(socket.on).toHaveBeenCalledWith('start_quiz', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('submit_answer', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('next_question', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('get_quiz_rankings', expect.any(Function));
    });
  });

  describe('start_quiz event', () => {
    beforeEach(() => {
      gameHandlers.register(socket as TypedSocket, io as TypedServer);
    });

    it('should start quiz successfully', () => {
      const mockRoom = {
        roomId: 'room-123',
        quizId: 'quiz-1',
        hostId: 'test-socket-id',
        isActive: false,
        currentQuestionIndex: 0,
        players: {
          'student-123': {
            socketId: 'student-socket-1',
            name: 'John Doe',
            studentId: 'student-123',
            score: 0,
            streak: 0,
            answers: [],
          },
        },
        questionOrder: ['q1', 'q2', 'q3'],
      };

      const mockQuestion = {
        id: 'q1',
        question: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        timeLimit: 30,
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.startQuiz as jest.Mock).mockReturnValue(true);
      (RoomService.getCurrentQuestion as jest.Mock).mockReturnValue(mockQuestion);
      (RoomService.setQuestionTimer as jest.Mock).mockImplementation(() => {});

      (socket as any).triggerEvent('start_quiz', { roomId: 'room-123' });

      expect(RoomService.startQuiz).toHaveBeenCalledWith('room-123');
      expect(io.to).toHaveBeenCalledWith('room-123');
      expect(RoomService.setQuestionTimer).toHaveBeenCalled();
    });

    it('should emit start_error when not authorized', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'different-socket-id',
        isActive: false,
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);

      (socket as any).triggerEvent('start_quiz', { roomId: 'room-123' });

      expect(socket.emit).toHaveBeenCalledWith('start_error', 'Not authorized to start quiz');
      expect(RoomService.startQuiz).not.toHaveBeenCalled();
    });

    it('should emit start_error when room not found', () => {
      (RoomService.getRoom as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('start_quiz', { roomId: 'nonexistent-room' });

      expect(socket.emit).toHaveBeenCalledWith('start_error', 'Not authorized to start quiz');
    });

    it('should emit start_error when quiz fails to start', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'test-socket-id',
        isActive: false,
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.startQuiz as jest.Mock).mockReturnValue(false);

      (socket as any).triggerEvent('start_quiz', { roomId: 'room-123' });

      expect(socket.emit).toHaveBeenCalledWith('start_error', 'Failed to start quiz');
    });

    it('should emit start_error when no questions available', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'test-socket-id',
        isActive: false,
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.startQuiz as jest.Mock).mockReturnValue(true);
      (RoomService.getCurrentQuestion as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('start_quiz', { roomId: 'room-123' });

      expect(socket.emit).toHaveBeenCalledWith('start_error', 'No questions available');
    });
  });

  describe('submit_answer event', () => {
    beforeEach(() => {
      gameHandlers.register(socket as TypedSocket, io as TypedServer);
    });

    it('should submit answer successfully', () => {
      const mockResult = {
        isCorrect: true,
        pointsEarned: 100,
        streak: 1,
        totalScore: 100,
      };

      const mockRoom = {
        roomId: 'room-123',
        players: {
          'student-123': { socketId: 'test-socket-id', name: 'John' },
          'student-456': { socketId: 'other-socket', name: 'Jane' },
        },
      };

      (RoomService.submitAnswer as jest.Mock).mockReturnValue(mockResult);
      (RoomService.checkAllPlayersAnswered as jest.Mock).mockReturnValue(false);

      (socket as any).triggerEvent('submit_answer', { roomId: 'room-123', answerId: 1 });

      expect(RoomService.submitAnswer).toHaveBeenCalledWith('room-123', 'test-socket-id', 1);
      expect(socket.emit).toHaveBeenCalledWith('answer_result', mockResult);
    });

    it('should end question when all players answered', () => {
      const mockResult = {
        isCorrect: true,
        pointsEarned: 100,
        streak: 1,
        totalScore: 100,
      };

      const mockRoom = {
        roomId: 'room-123',
        timer: setTimeout(() => {}, 1000),
        players: {},
      };

      const mockQuestionResults = {
        questionId: 'q1',
        question: 'What is 2+2?',
        correctAnswer: 1,
        playerAnswers: [],
      };

      (RoomService.submitAnswer as jest.Mock).mockReturnValue(mockResult);
      (RoomService.checkAllPlayersAnswered as jest.Mock).mockReturnValue(true);
      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.endQuestion as jest.Mock).mockReturnValue(mockQuestionResults);

      (socket as any).triggerEvent('submit_answer', { roomId: 'room-123', answerId: 1 });

      expect(RoomService.checkAllPlayersAnswered).toHaveBeenCalledWith('room-123');
      expect(RoomService.endQuestion).toHaveBeenCalledWith('room-123');
      expect(io.to).toHaveBeenCalledWith('room-123');
    });

    it('should handle answer submission errors', () => {
      (RoomService.submitAnswer as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid answer');
      });

      (socket as any).triggerEvent('submit_answer', { roomId: 'room-123', answerId: 1 });

      expect(socket.emit).toHaveBeenCalledWith('answer_error', 'Invalid answer');
    });
  });

  describe('next_question event', () => {
    beforeEach(() => {
      gameHandlers.register(socket as TypedSocket, io as TypedServer);
    });

    it('should move to next question successfully', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'test-socket-id',
        currentQuestionIndex: 0,
        players: {
          'student-123': {
            socketId: 'student-socket-1',
            name: 'John',
            score: 100,
            streak: 1,
          },
        },
        questionOrder: ['q1', 'q2', 'q3'],
      };

      const mockMoveResult = {
        completed: false,
        currentQuestionIndex: 1,
        totalQuestions: 3,
      };

      const mockNextQuestion = {
        id: 'q2',
        question: 'What is 3+3?',
        options: ['5', '6', '7', '8'],
        correctAnswer: 1,
        timeLimit: 30,
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.moveToNextQuestion as jest.Mock).mockReturnValue(mockMoveResult);
      (RoomService.getCurrentQuestion as jest.Mock).mockReturnValue(mockNextQuestion);
      (RoomService.setQuestionTimer as jest.Mock).mockImplementation(() => {});

      (socket as any).triggerEvent('next_question', 'room-123');

      expect(RoomService.moveToNextQuestion).toHaveBeenCalledWith('room-123');
      expect(RoomService.getCurrentQuestion).toHaveBeenCalledWith('room-123');
      expect(RoomService.setQuestionTimer).toHaveBeenCalled();
    });

    it('should emit next_error when not authorized', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'different-socket-id',
        teacherSessionId: 'teacher-456',
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.getTeacherSession as jest.Mock).mockReturnValue('teacher-123');

      (socket as any).triggerEvent('next_question', 'room-123');

      expect(socket.emit).toHaveBeenCalledWith('next_error', 'Not authorized to advance quiz');
    });

    it('should emit next_error when room not found', () => {
      (RoomService.getRoom as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('next_question', 'room-123');

      expect(socket.emit).toHaveBeenCalledWith('next_error', 'Room not found');
    });

    it('should end quiz when completed', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'test-socket-id',
        quizId: 'quiz-1',
        isActive: true,
        players: {
          'student-123': {
            socketId: 'student-socket-1',
            name: 'John',
            studentId: 'student-123',
            score: 250,
          },
        },
      };

      const mockMoveResult = {
        completed: true,
        currentQuestionIndex: 2,
        totalQuestions: 3,
      };

      const mockQuiz = {
        id: 'quiz-1',
        name: 'Test Quiz',
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.moveToNextQuestion as jest.Mock).mockReturnValue(mockMoveResult);
      (QuizService.getQuizById as jest.Mock).mockReturnValue(mockQuiz);
      (HistoryService.saveQuizHistory as jest.Mock).mockReturnValue(true);

      (socket as any).triggerEvent('next_question', 'room-123');

      expect(mockRoom.isActive).toBe(false);
      expect(io.to).toHaveBeenCalledWith('room-123');
    });

    it('should auto-correct hostId for same teacher session', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'old-socket-id',
        teacherSessionId: 'teacher-123',
        currentQuestionIndex: 0,
        players: {},
        questionOrder: ['q1', 'q2'],
      };

      const mockMoveResult = {
        completed: false,
        currentQuestionIndex: 1,
        totalQuestions: 2,
      };

      const mockNextQuestion = {
        id: 'q2',
        question: 'Question 2',
        options: ['A', 'B'],
        correctAnswer: 0,
        timeLimit: 30,
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.getTeacherSession as jest.Mock).mockReturnValue('teacher-123');
      (RoomService.moveToNextQuestion as jest.Mock).mockReturnValue(mockMoveResult);
      (RoomService.getCurrentQuestion as jest.Mock).mockReturnValue(mockNextQuestion);
      (RoomService.setQuestionTimer as jest.Mock).mockImplementation(() => {});

      (socket as any).triggerEvent('next_question', 'room-123');

      expect(mockRoom.hostId).toBe('test-socket-id');
      expect(RoomService.moveToNextQuestion).toHaveBeenCalled();
    });
  });

  describe('get_quiz_rankings event', () => {
    beforeEach(() => {
      gameHandlers.register(socket as TypedSocket, io as TypedServer);
    });

    it('should return quiz rankings from active room', () => {
      const mockRoom = {
        roomId: 'room-123',
        isActive: false,
        isCompleted: true,
        players: {
          'student-123': {
            socketId: 'socket-1',
            name: 'John',
            studentId: 'student-123',
            score: 100,
          },
          'student-456': {
            socketId: 'socket-2',
            name: 'Jane',
            studentId: 'student-456',
            score: 150,
          },
        },
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);

      (socket as any).triggerEvent('get_quiz_rankings', { roomId: 'room-123' });

      expect(socket.emit).toHaveBeenCalledWith('quiz_rankings', expect.objectContaining({
        roomId: 'room-123',
        rankings: expect.any(Array),
      }));
    });

    it('should return quiz rankings from history', () => {
      const mockHistoryItem = {
        roomId: 'room-123',
        quizName: 'Test Quiz',
        rankings: [
          { rank: 1, playerName: 'John', score: 100 },
          { rank: 2, playerName: 'Jane', score: 80 },
        ],
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(null);
      (HistoryService.getHistoryById as jest.Mock).mockReturnValue(mockHistoryItem);

      (socket as any).triggerEvent('get_quiz_rankings', { roomId: 'room-123' });

      expect(socket.emit).toHaveBeenCalledWith('quiz_rankings', mockHistoryItem);
    });

    it('should emit rankings_error when room not found', () => {
      (RoomService.getRoom as jest.Mock).mockReturnValue(null);
      (HistoryService.getHistoryById as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('get_quiz_rankings', { roomId: 'nonexistent-room' });

      expect(socket.emit).toHaveBeenCalledWith('rankings_error', 'Quiz results not found');
    });

    it('should handle when room not found', () => {
      (RoomService.getRoom as jest.Mock).mockReturnValue(null);
      (HistoryService.getHistoryById as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('get_quiz_rankings', { roomId: 'room-123' });

      expect(socket.emit).toHaveBeenCalledWith('rankings_error', 'Quiz results not found');
    });
  });
});
