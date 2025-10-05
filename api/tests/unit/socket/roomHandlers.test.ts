import roomHandlers from '../../../src/socket/handlers/roomHandlers';
import { mockSocket, mockServer, mockStudentSocket } from '../../helpers/mockSocket';
import RoomService from '../../../src/services/RoomService';
import QuizService from '../../../src/services/QuizService';
import { TypedSocket, TypedServer } from '../../../src/types/socket';

// Mock the services
jest.mock('../../../src/services/RoomService');
jest.mock('../../../src/services/QuizService');

describe('Room Handlers', () => {
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
    it('should register join_room and leave_room event listeners', () => {
      roomHandlers.register(socket as TypedSocket, io as TypedServer);

      expect(socket.on).toHaveBeenCalledWith('join_room', expect.any(Function));
      expect(socket.on).toHaveBeenCalledWith('leave_room', expect.any(Function));
    });
  });

  describe('join_room event', () => {
    beforeEach(() => {
      roomHandlers.register(socket as TypedSocket, io as TypedServer);
    });

    it('should allow student to join existing room', () => {
      const mockRoom = {
        roomId: 'room-123',
        quizId: 'quiz-1',
        isActive: false,
        currentQuestionIndex: -1,
        players: {},
        questionOrder: ['q1', 'q2', 'q3'],
      };

      const mockQuiz = {
        id: 'quiz-1',
        name: 'Test Quiz',
        description: 'Test Description',
        questions: [],
      };

      const mockPlayer = {
        socketId: 'test-socket-id',
        name: 'John Doe',
        studentId: 'student-123',
        score: 0,
        answers: [],
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.addPlayerToRoom as jest.Mock).mockReturnValue(mockPlayer);
      (QuizService.getQuizById as jest.Mock).mockReturnValue(mockQuiz);

      const joinData = {
        roomId: 'room-123',
        playerName: 'John Doe',
        studentId: 'student-123',
      };

      (socket as any).triggerEvent('join_room', joinData);

      expect(RoomService.getRoom).toHaveBeenCalledWith('room-123');
      expect(RoomService.addPlayerToRoom).toHaveBeenCalledWith('room-123', {
        socketId: 'test-socket-id',
        playerName: 'John Doe',
        studentId: 'student-123',
      });
      expect(socket.join).toHaveBeenCalledWith('room-123');
      expect(socket.emit).toHaveBeenCalledWith('joined_room', expect.objectContaining({
        roomId: 'room-123',
        isActive: false,
        quizName: 'Test Quiz',
      }));
    });

    it('should emit join_error when room does not exist', () => {
      (RoomService.getRoom as jest.Mock).mockReturnValue(null);

      const joinData = {
        roomId: 'nonexistent-room',
        playerName: 'John Doe',
        studentId: 'student-123',
      };

      (socket as any).triggerEvent('join_room', joinData);

      expect(socket.emit).toHaveBeenCalledWith('join_error', 'Room does not exist');
      expect(socket.join).not.toHaveBeenCalled();
    });

    it('should notify other players when student joins', () => {
      const mockRoom = {
        roomId: 'room-123',
        quizId: 'quiz-1',
        isActive: false,
        currentQuestionIndex: -1,
        players: {
          'student-456': {
            socketId: 'other-socket',
            name: 'Jane Smith',
            studentId: 'student-456',
            score: 0,
          },
        },
        questionOrder: ['q1'],
      };

      const mockPlayer = {
        socketId: 'test-socket-id',
        name: 'John Doe',
        studentId: 'student-123',
        score: 0,
        answers: [],
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.addPlayerToRoom as jest.Mock).mockReturnValue(mockPlayer);
      (QuizService.getQuizById as jest.Mock).mockReturnValue({ id: 'quiz-1', name: 'Test Quiz' });

      const joinData = {
        roomId: 'room-123',
        playerName: 'John Doe',
        studentId: 'student-123',
      };

      (socket as any).triggerEvent('join_room', joinData);

      expect(io.to).toHaveBeenCalledWith('room-123');
    });

    it('should handle rejoin to active quiz', () => {
      const mockPlayer = {
        socketId: 'test-socket-id',
        name: 'John Doe',
        studentId: 'student-123',
        score: 0,
        answers: [],
        streak: 0,
      };

      const mockRoom = {
        roomId: 'room-123',
        quizId: 'quiz-1',
        isActive: true,
        currentQuestionIndex: 0,
        players: {
          'student-123': mockPlayer,
        },
        questionOrder: ['q1', 'q2'],
        questionStartTime: Date.now() - 5000, // Started 5 seconds ago
        questionEndedState: false,
      };

      const mockQuestion = {
        id: 'q1',
        question: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        timeLimit: 30,
      };

      // Mock getAllRooms to return our mock room
      (RoomService.getAllRooms as jest.Mock).mockReturnValue({ 'room-123': mockRoom });
      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.addPlayerToRoom as jest.Mock).mockReturnValue(mockPlayer);
      (RoomService.getCurrentQuestion as jest.Mock).mockReturnValue(mockQuestion);
      (QuizService.getQuizById as jest.Mock).mockReturnValue({ id: 'quiz-1', name: 'Test Quiz' });

      const joinData = {
        roomId: 'room-123',
        playerName: 'John Doe',
        studentId: 'student-123',
      };

      (socket as any).triggerEvent('join_room', joinData);

      expect(RoomService.getCurrentQuestion).toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith('new_question', expect.objectContaining({
        questionId: 'q1',
        question: 'What is 2+2?',
      }));
    });

    it('should handle errors gracefully', () => {
      (RoomService.getRoom as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const joinData = {
        roomId: 'room-123',
        playerName: 'John Doe',
        studentId: 'student-123',
      };

      (socket as any).triggerEvent('join_room', joinData);

      expect(socket.emit).toHaveBeenCalledWith('join_error', 'Database error');
    });
  });

  describe('leave_room event', () => {
    beforeEach(() => {
      roomHandlers.register(socket as TypedSocket, io as TypedServer);
    });

    it('should allow student to leave room', () => {
      const mockRoom = {
        roomId: 'room-123',
        players: {
          'student-123': {
            socketId: 'test-socket-id',
            name: 'John Doe',
            score: 0,
          },
        },
      };

      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.removePlayerFromRoom as jest.Mock).mockReturnValue(true);

      (socket as any).triggerEvent('leave_room', 'room-123', false);

      expect(RoomService.removePlayerFromRoom).toHaveBeenCalledWith('room-123', 'test-socket-id');
      expect(socket.leave).toHaveBeenCalledWith('room-123');
      expect(io.to).toHaveBeenCalledWith('room-123');
    });

    it('should do nothing if room does not exist', () => {
      (RoomService.getRoom as jest.Mock).mockReturnValue(null);

      (socket as any).triggerEvent('leave_room', 'nonexistent-room', false);

      expect(RoomService.removePlayerFromRoom).not.toHaveBeenCalled();
      expect(socket.leave).not.toHaveBeenCalled();
    });

    it('should notify other players when student leaves', () => {
      const mockRoom = {
        roomId: 'room-123',
        players: {
          'student-456': {
            socketId: 'other-socket',
            name: 'Jane Smith',
            score: 10,
          },
        },
      };

      const toEmitMock = jest.fn();
      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (RoomService.removePlayerFromRoom as jest.Mock).mockReturnValue(true);
      (io.to as jest.Mock).mockReturnValue({ emit: toEmitMock });

      (socket as any).triggerEvent('leave_room', 'room-123', false);

      expect(io.to).toHaveBeenCalledWith('room-123');
      expect(toEmitMock).toHaveBeenCalledWith('player_left', expect.objectContaining({
        playerId: 'test-socket-id',
      }));
    });
  });

  describe('handleDisconnect', () => {
    it('should handle student disconnection from room', () => {
      const mockRoom = {
        roomId: 'room-123',
        players: {
          'student-123': {
            socketId: 'test-socket-id',
            name: 'John Doe',
            score: 10,
          },
        },
        socketToStudent: {
          'test-socket-id': 'student-123',
        },
      };

      const allRooms = {
        'room-123': mockRoom,
      };

      (RoomService.getAllRooms as jest.Mock).mockReturnValue(allRooms);
      (RoomService.getRoom as jest.Mock).mockReturnValue(mockRoom);

      roomHandlers.handleDisconnect(socket as TypedSocket, io as TypedServer);

      expect(mockRoom.players['student-123'].socketId).toBeNull();
      expect(mockRoom.socketToStudent['test-socket-id']).toBeUndefined();
      expect(io.to).toHaveBeenCalledWith('room-123');
    });

    it('should handle disconnection when player not in any room', () => {
      (RoomService.getAllRooms as jest.Mock).mockReturnValue({});

      roomHandlers.handleDisconnect(socket as TypedSocket, io as TypedServer);

      expect(io.to).not.toHaveBeenCalled();
    });

    it('should handle disconnection from multiple rooms', () => {
      const mockRoom1 = {
        roomId: 'room-123',
        players: {
          'student-123': {
            socketId: 'test-socket-id',
            name: 'John Doe',
          },
        },
        socketToStudent: {
          'test-socket-id': 'student-123',
        },
      };

      const mockRoom2 = {
        roomId: 'room-456',
        players: {
          'student-456': {
            socketId: 'other-socket',
            name: 'Jane Smith',
          },
        },
        socketToStudent: {
          'other-socket': 'student-456',
        },
      };

      const allRooms = {
        'room-123': mockRoom1,
        'room-456': mockRoom2,
      };

      (RoomService.getAllRooms as jest.Mock).mockReturnValue(allRooms);
      (RoomService.getRoom as jest.Mock).mockImplementation((roomId: string) => (allRooms as any)[roomId]);

      roomHandlers.handleDisconnect(socket as TypedSocket, io as TypedServer);

      expect(mockRoom1.players['student-123'].socketId).toBeNull();
      expect(io.to).toHaveBeenCalledWith('room-123');
    });
  });
});
