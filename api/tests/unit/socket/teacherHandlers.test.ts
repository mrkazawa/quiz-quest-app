import teacherHandlers from '../../../src/socket/handlers/teacherHandlers';
import { mockSocket, mockServer, mockTeacherSocket } from '../../helpers/mockSocket';
import RoomService from '../../../src/services/RoomService';
import QuizService from '../../../src/services/QuizService';
import HistoryService from '../../../src/services/HistoryService';
import { TypedSocket, TypedServer } from '../../../src/types/socket';

// Mock the services
jest.mock('../../../src/services/RoomService');
jest.mock('../../../src/services/QuizService');
jest.mock('../../../src/services/HistoryService');

describe('Teacher Handlers', () => {
  let socket: Partial<TypedSocket>;
  let io: Partial<TypedServer>;

  beforeEach(() => {
    socket = mockSocket();
    io = mockServer();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('register', () => {
    it('should register teacher event listeners', () => {
      teacherHandlers.register(socket as TypedSocket, io as TypedServer);

      expect(socket.on).toHaveBeenCalledWith('create_room', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('join_teacher_room', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('get_room_info', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('delete_room', expect.any(Function));
    });
  });

  describe('create_room event', () => {
    beforeEach(() => {
      teacherHandlers.register(socket as TypedSocket, io as TypedServer);
    });

    it('should create room successfully', () => {
      const mockQuestionSet = {
        id: 'quiz-1',
        name: 'Test Quiz',
        description: 'Test Description',
        questions: [
          { id: 'q1', question: 'Question 1', options: [], correctAnswer: 0, timeLimit: 30 },
        ],
      };

      const mockRoom = {
        roomId: 'room-123',
        quizId: 'quiz-1',
        hostId: 'test-socket-id',
        isActive: false,
        players: {},
      };

      (QuizService.getQuizById as jest.Mock).mockReturnValue(mockQuestionSet);
      (RoomService.createRoom as jest.Mock).mockReturnValue('room-123');
      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.updateTeacherSession as jest.Mock).mockImplementation(() => {});

      (socket as any).triggerEvent('create_room', { quizId: 'quiz-1', teacherId: 'teacher-123' });

      expect(QuizService.getQuizById).toHaveBeenCalledWith('quiz-1');
      expect(RoomService.createRoom).toHaveBeenCalledWith('quiz-1', 'teacher-123', mockQuestionSet);
      expect(socket.join).toHaveBeenCalledWith('room-123');
      expect(socket.emit).toHaveBeenCalledWith('room_created', { roomId: 'room-123', quizId: 'quiz-1' });
    });

    it('should emit room_error when quiz not found', () => {
      (QuizService.getQuizById as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('create_room', { quizId: 'nonexistent-quiz', teacherId: 'teacher-123' });

      expect(socket.emit).toHaveBeenCalledWith('room_error', 'Quiz not found');
      expect(RoomService.createRoom).not.toHaveBeenCalled();
    });

    it('should emit room_error when room creation fails', () => {
      const mockQuestionSet = {
        id: 'quiz-1',
        name: 'Test Quiz',
        questions: [],
      };

      (QuizService.getQuizById as jest.Mock).mockReturnValue(mockQuestionSet);
      (RoomService.createRoom as jest.Mock).mockReturnValue('room-123');
      (RoomService.getRoom as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('create_room', { quizId: 'quiz-1', teacherId: 'teacher-123' });

      expect(socket.emit).toHaveBeenCalledWith('room_error', 'Failed to create room');
    });

    it('should handle errors gracefully', () => {
      // Return a valid quiz but make createRoom throw
      const mockQuestionSet = {
        id: 'quiz-1',
        name: 'Test Quiz',
        questions: [],
      };
      
      (QuizService.getQuizById as jest.Mock).mockReturnValue(mockQuestionSet);
      (RoomService.createRoom as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      (socket as any).triggerEvent('create_room', { quizId: 'quiz-1', teacherId: 'teacher-123' });

      expect(socket.emit).toHaveBeenCalledWith('room_error', 'Failed to create room');
    });
  });

  describe('join_teacher_room event', () => {
    beforeEach(() => {
      teacherHandlers.register(socket as TypedSocket, io as TypedServer);
    });

    it('should allow teacher to join active room', () => {
      const mockRoom = {
        roomId: 'room-123',
        quizId: 'quiz-1',
        hostId: null,
        teacherSessionId: 'teacher-123',
        isActive: false,
        players: {
          'student-123': {
            socketId: 'student-socket-1',
            name: 'John Doe',
            studentId: 'student-123',
            score: 0,
          },
        },
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.updateTeacherSession as jest.Mock).mockImplementation(() => {});

      (socket as any).triggerEvent('join_teacher_room', { roomId: 'room-123', teacherId: 'teacher-123' });

      expect(socket.join).toHaveBeenCalledWith('room-123');
      expect(socket.emit).toHaveBeenCalledWith('teacher_joined_room', expect.objectContaining({
        roomId: 'room-123',
        isActive: false,
      }));
    });

    it('should allow teacher to join completed room from history', () => {
      const mockHistoryItem = {
        roomId: 'room-123',
        quizName: 'Test Quiz',
        rankings: [
          { rank: 1, playerName: 'John', score: 100 },
        ],
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(null);
      (HistoryService.getHistoryById as jest.Mock).mockReturnValue(mockHistoryItem);

      (socket as any).triggerEvent('join_teacher_room', { roomId: 'room-123', teacherId: 'teacher-123' });

      expect(socket.emit).toHaveBeenCalledWith('teacher_joined_completed_room', {
        roomId: 'room-123',
        isCompleted: true,
        historyId: 'room-123',
      });
      expect(socket.emit).toHaveBeenCalledWith('quiz_rankings', mockHistoryItem);
    });

    it('should handle completed room with rankings', () => {
      const mockRoom = {
        roomId: 'room-123',
        quizId: 'quiz-1',
        isCompleted: true,
        completedAt: Date.now(),
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

      const mockQuiz = {
        id: 'quiz-1',
        name: 'Test Quiz',
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (QuizService.getQuizById as jest.Mock).mockReturnValue(mockQuiz);

      (socket as any).triggerEvent('join_teacher_room', { roomId: 'room-123', teacherId: 'teacher-123' });

      expect(socket.emit).toHaveBeenCalledWith('teacher_joined_completed_room', expect.objectContaining({
        roomId: 'room-123',
        isCompleted: true,
      }));
      expect(socket.emit).toHaveBeenCalledWith('quiz_rankings', expect.objectContaining({
        roomId: 'room-123',
        quizName: 'Test Quiz',
      }));
    });

    it('should emit join_error when room not found', () => {
      (RoomService.getRoom as jest.Mock).mockReturnValue(null);
      (HistoryService.getHistoryById as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('join_teacher_room', { roomId: 'nonexistent-room', teacherId: 'teacher-123' });

      expect(socket.emit).toHaveBeenCalledWith('join_error', 'Room not found');
    });

    it('should emit join_error when another teacher is hosting', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'different-socket-id',
        teacherSessionId: 'teacher-456',
        isActive: true,
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);

      (socket as any).triggerEvent('join_teacher_room', { roomId: 'room-123', teacherId: 'teacher-123' });

      expect(socket.emit).toHaveBeenCalledWith('join_error', 'Another teacher is already hosting this room');
    });

    it('should handle teacher rejoin to active quiz', () => {
      const mockRoom = {
        roomId: 'room-123',
        quizId: 'quiz-1',
        hostId: null,
        teacherSessionId: 'teacher-123',
        isActive: true,
        currentQuestionIndex: 0,
        questionOrder: ['q1', 'q2'],
        questionStartTime: Date.now() - 5000,
        questionEndedState: false,
        players: {},
      };

      const mockQuestion = {
        id: 'q1',
        question: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        timeLimit: 30,
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.getCurrentQuestion as jest.Mock).mockReturnValue(mockQuestion);
      (RoomService.updateTeacherSession as jest.Mock).mockImplementation(() => {});

      (socket as any).triggerEvent('join_teacher_room', { roomId: 'room-123', teacherId: 'teacher-123' });

      expect(RoomService.getCurrentQuestion).toHaveBeenCalledWith('room-123');
      expect(socket.emit).toHaveBeenCalledWith('new_question', expect.objectContaining({
        questionId: 'q1',
        question: 'What is 2+2?',
      }));
    });
  });

  describe('get_room_info event', () => {
    beforeEach(() => {
      teacherHandlers.register(socket as TypedSocket, io as TypedServer);
    });

    it('should return room info successfully', () => {
      const mockRoom = {
        roomId: 'room-123',
        quizId: 'quiz-1',
        hostId: 'test-socket-id',
        players: {
          'student-123': {
            socketId: 'socket-1',
            studentId: 'student-123',
            name: 'John Doe',
          },
          'student-456': {
            socketId: 'socket-2',
            studentId: 'student-456',
            name: 'Jane Smith',
          },
        },
      };

      const mockQuiz = {
        id: 'quiz-1',
        name: 'Test Quiz',
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (QuizService.getQuizById as jest.Mock).mockReturnValue(mockQuiz);

      (socket as any).triggerEvent('get_room_info', { roomId: 'room-123' });

      expect(socket.emit).toHaveBeenCalledWith('room_info', expect.objectContaining({
        roomId: 'room-123',
        quizName: 'Test Quiz',
        students: expect.arrayContaining([
          expect.objectContaining({ name: 'John Doe' }),
          expect.objectContaining({ name: 'Jane Smith' }),
        ]),
      }));
    });

    it('should emit room_error when room not found', () => {
      (RoomService.getRoom as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('get_room_info', { roomId: 'nonexistent-room' });

      expect(socket.emit).toHaveBeenCalledWith('room_error', 'Room not found');
    });

    it('should update host and join room if needed', () => {
      const mockRoom = {
        roomId: 'room-123',
        quizId: 'quiz-1',
        hostId: 'old-socket-id',
        players: {},
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (QuizService.getQuizById as jest.Mock).mockReturnValue({ id: 'quiz-1', name: 'Test Quiz' });

      (socket as any).triggerEvent('get_room_info', { roomId: 'room-123' });

      expect(mockRoom.hostId).toBe('test-socket-id');
      expect(socket.join).toHaveBeenCalledWith('room-123');
    });
  });

  describe('delete_room event', () => {
    beforeEach(() => {
      teacherHandlers.register(socket as TypedSocket, io as TypedServer);
    });

    it('should delete room successfully', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'test-socket-id',
        players: {},
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.deleteRoom as jest.Mock).mockReturnValue(true);

      (socket as any).triggerEvent('delete_room', { roomId: 'room-123' });

      expect(RoomService.deleteRoom).toHaveBeenCalledWith('room-123');
      expect(io.to).toHaveBeenCalledWith('room-123');
    });

    it('should emit room_error when room not found', () => {
      (RoomService.getRoom as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('delete_room', { roomId: 'nonexistent-room' });

      expect(socket.emit).toHaveBeenCalledWith('room_error', 'Room not found');
      expect(RoomService.deleteRoom).not.toHaveBeenCalled();
    });

    it('should emit room_error when not authorized', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'different-socket-id',
        players: {},
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);

      (socket as any).triggerEvent('delete_room', { roomId: 'room-123' });

      expect(socket.emit).toHaveBeenCalledWith('room_error', 'Not authorized to delete this room');
      expect(RoomService.deleteRoom).not.toHaveBeenCalled();
    });

    it('should notify all players when room is deleted', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'test-socket-id',
        players: {
          'student-123': { socketId: 'socket-1', name: 'John' },
          'student-456': { socketId: 'socket-2', name: 'Jane' },
        },
      };

      const toEmitMock = jest.fn();
      (io.to as jest.Mock).mockReturnValue({ emit: toEmitMock });
      
      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.deleteRoom as jest.Mock).mockReturnValue(true);

      (socket as any).triggerEvent('delete_room', { roomId: 'room-123' });

      expect(io.to).toHaveBeenCalledWith('room-123');
      expect(toEmitMock).toHaveBeenCalledWith('room_deleted', { message: 'Room was deleted by teacher' });
      expect(RoomService.deleteRoom).toHaveBeenCalledWith('room-123');
    });
  });

  describe('handleDisconnect', () => {
    it('should handle teacher disconnection', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'test-socket-id',
        teacherSessionId: 'teacher-123',
        isActive: false,
      };

      const allRooms = {
        'room-123': mockRoom,
      };

      (RoomService.getAllRooms as jest.Mock).mockReturnValue(allRooms);
      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.cleanupTeacherSession as jest.Mock).mockImplementation(() => {});

      teacherHandlers.handleDisconnect(socket as TypedSocket, io as TypedServer);

      expect(RoomService.cleanupTeacherSession).toHaveBeenCalledWith('test-socket-id');
      expect(mockRoom.hostId).toBeNull();
    });

    it('should not affect rooms hosted by other teachers', () => {
      const mockRoom = {
        roomId: 'room-123',
        hostId: 'different-socket-id',
        teacherSessionId: 'teacher-456',
      };

      const allRooms = {
        'room-123': mockRoom,
      };

      (RoomService.getAllRooms as jest.Mock).mockReturnValue(allRooms);

      teacherHandlers.handleDisconnect(socket as TypedSocket, io as TypedServer);

      expect(mockRoom.hostId).toBe('different-socket-id');
    });
  });
});
