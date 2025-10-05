import RoomService from '../../../src/services/RoomService';
import {
  mockQuestion1,
  mockQuestion2,
  mockQuestion3,
  mockPlayer1,
  mockPlayer2,
  mockPlayer3,
  mockTeacherId,
  createMockQuestions,
} from '../../helpers/mockData';

describe('RoomService', () => {
  let roomService: typeof RoomService;
  let testRoomId: string;

  beforeEach(() => {
    // Clean up rooms before each test using the new helper
    RoomService.clearAllRooms();
  });

  afterEach(() => {
    // Cleanup after each test
    RoomService.cleanup();
  });

  describe('createRoom', () => {
    it('should create a room with unique 6-digit code', () => {
      const questionSet = { questions: [mockQuestion1, mockQuestion2] };
      const roomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);

      expect(roomId).toMatch(/^\d{6}$/);
      expect(roomId.length).toBe(6);
    });

    it('should create room with correct initial state', () => {
      const questionSet = { questions: [mockQuestion1, mockQuestion2, mockQuestion3] };
      const roomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
      const room = RoomService.getRoom(roomId);

      expect(room).toBeDefined();
      expect(room?.quizId).toBe('quiz-123');
      expect(room?.isActive).toBe(false);
      expect(room?.currentQuestionIndex).toBe(0);
      expect(room?.teacherSessionId).toBe(mockTeacherId);
      expect(room?.questionOrder).toHaveLength(3);
      expect(room?.players).toEqual({});
    });

    it('should generate unique room codes', () => {
      const questionSet = { questions: [mockQuestion1] };
      const roomId1 = RoomService.createRoom('quiz-1', mockTeacherId, questionSet);
      const roomId2 = RoomService.createRoom('quiz-2', mockTeacherId, questionSet);
      const roomId3 = RoomService.createRoom('quiz-3', mockTeacherId, questionSet);

      expect(roomId1).not.toBe(roomId2);
      expect(roomId2).not.toBe(roomId3);
      expect(roomId1).not.toBe(roomId3);
    });

    it('should store questions as a map by ID', () => {
      const questionSet = { questions: [mockQuestion1, mockQuestion2] };
      const roomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
      const room = RoomService.getRoom(roomId);

      expect(room?.questions[1]).toEqual(mockQuestion1);
      expect(room?.questions[2]).toEqual(mockQuestion2);
    });

    it('should initialize question order array', () => {
      const questionSet = { questions: [mockQuestion1, mockQuestion2, mockQuestion3] };
      const roomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
      const room = RoomService.getRoom(roomId);

      expect(room?.questionOrder).toEqual([1, 2, 3]);
    });
  });

  describe('getRoom', () => {
    beforeEach(() => {
      const questionSet = { questions: [mockQuestion1] };
      testRoomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
    });

    it('should return room by ID', () => {
      const room = RoomService.getRoom(testRoomId);

      expect(room).toBeDefined();
      expect(room?.quizId).toBe('quiz-123');
    });

    it('should return undefined for non-existent room', () => {
      const room = RoomService.getRoom('999999');

      expect(room).toBeUndefined();
    });
  });

  describe('deleteRoom', () => {
    beforeEach(() => {
      const questionSet = { questions: [mockQuestion1] };
      testRoomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
    });

    it('should delete an existing room', () => {
      const result = RoomService.deleteRoom(testRoomId);

      expect(result).toBe(true);
      expect(RoomService.getRoom(testRoomId)).toBeUndefined();
    });

    it('should return false when deleting non-existent room', () => {
      const result = RoomService.deleteRoom('999999');

      expect(result).toBe(false);
    });

    it('should clear room timers when deleting', () => {
      const room = RoomService.getRoom(testRoomId);
      
      // Manually set a timer to test cleanup
      if (room) {
        room.timer = setTimeout(() => {}, 10000) as NodeJS.Timeout;
        room.deletionTimer = setTimeout(() => {}, 10000) as NodeJS.Timeout;
      }

      RoomService.deleteRoom(testRoomId);

      // Room should be completely removed
      expect(RoomService.getRoom(testRoomId)).toBeUndefined();
    });
  });

  describe('addPlayerToRoom', () => {
    beforeEach(() => {
      const questionSet = { questions: [mockQuestion1, mockQuestion2] };
      testRoomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
    });

    it('should add a new player to room', () => {
      const player = RoomService.addPlayerToRoom(testRoomId, mockPlayer1);

      expect(player).toBeDefined();
      expect(player.studentId).toBe('student-001');
      expect(player.name).toBe('Alice');
      expect(player.socketId).toBe('socket-123');
      expect(player.score).toBe(0);
      expect(player.streak).toBe(0);
      expect(player.answers).toEqual([]);
    });

    it('should throw error for non-existent room', () => {
      expect(() => {
        RoomService.addPlayerToRoom('999999', mockPlayer1);
      }).toThrow('Room not found');
    });

    it('should allow multiple players to join', () => {
      RoomService.addPlayerToRoom(testRoomId, mockPlayer1);
      RoomService.addPlayerToRoom(testRoomId, mockPlayer2);
      RoomService.addPlayerToRoom(testRoomId, mockPlayer3);

      const room = RoomService.getRoom(testRoomId);
      expect(Object.keys(room?.players || {})).toHaveLength(3);
    });

    it('should track socket to student mapping', () => {
      RoomService.addPlayerToRoom(testRoomId, mockPlayer1);

      const room = RoomService.getRoom(testRoomId);
      expect(room?.socketToStudent['socket-123']).toBe('student-001');
    });

    it('should add student to history', () => {
      RoomService.addPlayerToRoom(testRoomId, mockPlayer1);

      const room = RoomService.getRoom(testRoomId);
      expect(room?.studentHistory.has('student-001')).toBe(true);
    });

    it('should allow player to rejoin with updated socket ID', () => {
      // First join
      RoomService.addPlayerToRoom(testRoomId, mockPlayer1);

      // Player rejoins with new socket
      const rejoiningPlayer = {
        ...mockPlayer1,
        socketId: 'new-socket-456',
      };
      const player = RoomService.addPlayerToRoom(testRoomId, rejoiningPlayer);

      expect(player.socketId).toBe('new-socket-456');
      expect(player.studentId).toBe('student-001');

      const room = RoomService.getRoom(testRoomId);
      expect(room?.socketToStudent['new-socket-456']).toBe('student-001');
    });

    it('should prevent new players from joining active quiz', () => {
      // Start the quiz
      RoomService.startQuiz(testRoomId);

      // Try to add a new player
      expect(() => {
        RoomService.addPlayerToRoom(testRoomId, mockPlayer1);
      }).toThrow('Quiz already started');
    });

    it('should allow previous player to rejoin active quiz', () => {
      // Add player before quiz starts
      RoomService.addPlayerToRoom(testRoomId, mockPlayer1);

      // Start the quiz
      RoomService.startQuiz(testRoomId);

      // Player rejoins with new socket (simulating disconnect/reconnect)
      const rejoiningPlayer = {
        ...mockPlayer1,
        socketId: 'reconnect-socket-789',
      };

      expect(() => {
        RoomService.addPlayerToRoom(testRoomId, rejoiningPlayer);
      }).not.toThrow();

      const player = RoomService.addPlayerToRoom(testRoomId, rejoiningPlayer);
      expect(player.socketId).toBe('reconnect-socket-789');
    });
  });

  describe('removePlayerFromRoom', () => {
    beforeEach(() => {
      const questionSet = { questions: [mockQuestion1] };
      testRoomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
      RoomService.addPlayerToRoom(testRoomId, mockPlayer1);
    });

    it('should remove player from room', () => {
      const result = RoomService.removePlayerFromRoom(testRoomId, 'socket-123');

      expect(result).toBeDefined();
      expect(result).not.toBe(false);
      if (result !== false) {
        expect(result.studentId).toBe('student-001');
        expect(result.removed).toBe(true);
      }
    });

    it('should remove socket mapping', () => {
      RoomService.removePlayerFromRoom(testRoomId, 'socket-123');

      const room = RoomService.getRoom(testRoomId);
      expect(room?.socketToStudent['socket-123']).toBeUndefined();
    });

    it('should remove player completely', () => {
      RoomService.removePlayerFromRoom(testRoomId, 'socket-123');

      const room = RoomService.getRoom(testRoomId);
      expect(room?.players['student-001']).toBeUndefined();
    });

    it('should return false for non-existent room', () => {
      const result = RoomService.removePlayerFromRoom('999999', 'socket-123');

      expect(result).toBe(false);
    });

    it('should return false for non-existent player', () => {
      const result = RoomService.removePlayerFromRoom(testRoomId, 'invalid-socket');

      expect(result).toBe(false);
    });
  });

  describe('startQuiz', () => {
    beforeEach(() => {
      const questionSet = { questions: [mockQuestion1, mockQuestion2] };
      testRoomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
      RoomService.addPlayerToRoom(testRoomId, mockPlayer1);
      RoomService.addPlayerToRoom(testRoomId, mockPlayer2);
    });

    it('should start the quiz', () => {
      const result = RoomService.startQuiz(testRoomId);

      expect(result).toBe(true);
    });

    it('should set room to active', () => {
      RoomService.startQuiz(testRoomId);

      const room = RoomService.getRoom(testRoomId);
      expect(room?.isActive).toBe(true);
    });

    it('should reset current question index', () => {
      const room = RoomService.getRoom(testRoomId);
      if (room) {
        room.currentQuestionIndex = 5; // Set to non-zero
      }

      RoomService.startQuiz(testRoomId);

      expect(room?.currentQuestionIndex).toBe(0);
    });

    it('should reset all player scores', () => {
      const room = RoomService.getRoom(testRoomId);
      if (room) {
        room.players['student-001'].score = 100;
        room.players['student-002'].score = 200;
      }

      RoomService.startQuiz(testRoomId);

      expect(room?.players['student-001'].score).toBe(0);
      expect(room?.players['student-002'].score).toBe(0);
    });

    it('should reset all player streaks', () => {
      const room = RoomService.getRoom(testRoomId);
      if (room) {
        room.players['student-001'].streak = 5;
        room.players['student-002'].streak = 3;
      }

      RoomService.startQuiz(testRoomId);

      expect(room?.players['student-001'].streak).toBe(0);
      expect(room?.players['student-002'].streak).toBe(0);
    });

    it('should clear player answers', () => {
      const room = RoomService.getRoom(testRoomId);
      if (room) {
        room.players['student-001'].answers = [
          { questionId: 1, answerId: 2, isCorrect: true, timeTaken: 5 },
        ];
      }

      RoomService.startQuiz(testRoomId);

      expect(room?.players['student-001'].answers).toEqual([]);
    });

    it('should set question start time', () => {
      RoomService.startQuiz(testRoomId);

      const room = RoomService.getRoom(testRoomId);
      expect(room?.questionStartTime).toBeDefined();
      expect(typeof room?.questionStartTime).toBe('number');
    });

    it('should return false for non-existent room', () => {
      const result = RoomService.startQuiz('999999');

      expect(result).toBe(false);
    });
  });

  describe('getCurrentQuestion', () => {
    beforeEach(() => {
      const questionSet = { questions: [mockQuestion1, mockQuestion2, mockQuestion3] };
      testRoomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
    });

    it('should return first question initially', () => {
      const question = RoomService.getCurrentQuestion(testRoomId);

      expect(question).toBeDefined();
      expect(question?.id).toBe(1);
      expect(question?.question).toBe('What is the capital of France?');
    });

    it('should return null for non-existent room', () => {
      const question = RoomService.getCurrentQuestion('999999');

      expect(question).toBeNull();
    });

    it('should return correct question after moving to next', () => {
      const room = RoomService.getRoom(testRoomId);
      if (room) {
        room.currentQuestionIndex = 1;
      }

      const question = RoomService.getCurrentQuestion(testRoomId);

      expect(question?.id).toBe(2);
    });
  });

  describe('submitAnswer', () => {
    beforeEach(() => {
      const questionSet = { questions: [mockQuestion1, mockQuestion2] };
      testRoomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
      RoomService.addPlayerToRoom(testRoomId, mockPlayer1);
      RoomService.startQuiz(testRoomId);
    });

    it('should accept correct answer', () => {
      const result = RoomService.submitAnswer(testRoomId, 'socket-123', 2); // Correct answer for mockQuestion1

      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBeGreaterThan(0);
      expect(result.streak).toBe(1);
    });

    it('should accept incorrect answer', () => {
      const result = RoomService.submitAnswer(testRoomId, 'socket-123', 0); // Incorrect answer

      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
      expect(result.streak).toBe(0);
    });

    it('should update player score for correct answer', () => {
      const result = RoomService.submitAnswer(testRoomId, 'socket-123', 2);

      expect(result.totalScore).toBeGreaterThan(0);

      const room = RoomService.getRoom(testRoomId);
      expect(room?.players['student-001'].score).toBe(result.totalScore);
    });

    it('should increase streak on correct answer', () => {
      RoomService.submitAnswer(testRoomId, 'socket-123', 2); // Correct

      const room = RoomService.getRoom(testRoomId);
      expect(room?.players['student-001'].streak).toBe(1);
    });

    it('should reset streak on incorrect answer', () => {
      const room = RoomService.getRoom(testRoomId);
      if (room) {
        room.players['student-001'].streak = 5;
      }

      RoomService.submitAnswer(testRoomId, 'socket-123', 0); // Incorrect

      expect(room?.players['student-001'].streak).toBe(0);
    });

    it('should store answer in player history', () => {
      RoomService.submitAnswer(testRoomId, 'socket-123', 2);

      const room = RoomService.getRoom(testRoomId);
      const answers = room?.players['student-001'].answers;

      expect(answers).toHaveLength(1);
      expect(answers?.[0].questionId).toBe(1);
      expect(answers?.[0].answerId).toBe(2);
      expect(answers?.[0].isCorrect).toBe(true);
    });

    it('should throw error when quiz is not active', () => {
      const questionSet = { questions: [mockQuestion1] };
      const inactiveRoomId = RoomService.createRoom('quiz-456', mockTeacherId, questionSet);

      expect(() => {
        RoomService.submitAnswer(inactiveRoomId, 'socket-123', 0);
      }).toThrow('Cannot submit answer at this time');
    });

    it('should throw error when player already answered', () => {
      RoomService.submitAnswer(testRoomId, 'socket-123', 2);

      expect(() => {
        RoomService.submitAnswer(testRoomId, 'socket-123', 1);
      }).toThrow('You have already answered this question');
    });

    it('should throw error for non-existent student', () => {
      expect(() => {
        RoomService.submitAnswer(testRoomId, 'invalid-socket', 0);
      }).toThrow('Student not found in room');
    });
  });

  describe('checkAllPlayersAnswered', () => {
    beforeEach(() => {
      const questionSet = { questions: [mockQuestion1] };
      testRoomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
      RoomService.addPlayerToRoom(testRoomId, mockPlayer1);
      RoomService.addPlayerToRoom(testRoomId, mockPlayer2);
      RoomService.startQuiz(testRoomId);
    });

    it('should return false when not all players answered', () => {
      RoomService.submitAnswer(testRoomId, 'socket-123', 2);

      const allAnswered = RoomService.checkAllPlayersAnswered(testRoomId);

      expect(allAnswered).toBe(false);
    });

    it('should return true when all players answered', () => {
      RoomService.submitAnswer(testRoomId, 'socket-123', 2);
      RoomService.submitAnswer(testRoomId, 'socket-456', 1);

      const allAnswered = RoomService.checkAllPlayersAnswered(testRoomId);

      expect(allAnswered).toBe(true);
    });

    it('should return false for non-existent room', () => {
      const allAnswered = RoomService.checkAllPlayersAnswered('999999');

      expect(allAnswered).toBe(false);
    });
  });

  describe('moveToNextQuestion', () => {
    beforeEach(() => {
      const questionSet = { questions: [mockQuestion1, mockQuestion2, mockQuestion3] };
      testRoomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
      RoomService.startQuiz(testRoomId);
    });

    it('should move to next question', () => {
      const result = RoomService.moveToNextQuestion(testRoomId);

      expect(result).not.toBe(false);
      if (result !== false) {
        expect(result.completed).toBe(false);
        expect(result.currentQuestionIndex).toBe(1);
        expect(result.totalQuestions).toBe(3);
      }
    });

    it('should update question index', () => {
      RoomService.moveToNextQuestion(testRoomId);

      const room = RoomService.getRoom(testRoomId);
      expect(room?.currentQuestionIndex).toBe(1);
    });

    it('should reset question start time', () => {
      RoomService.moveToNextQuestion(testRoomId);

      const room = RoomService.getRoom(testRoomId);
      expect(room?.questionStartTime).toBeDefined();
    });

    it('should indicate completion when reaching last question', () => {
      const room = RoomService.getRoom(testRoomId);
      if (room) {
        room.currentQuestionIndex = 2; // Set to last question (index 2 of 3 questions)
      }

      const result = RoomService.moveToNextQuestion(testRoomId);

      expect(result).not.toBe(false);
      if (result !== false) {
        expect(result.completed).toBe(true);
      }
    });

    it('should return false for non-existent room', () => {
      const result = RoomService.moveToNextQuestion('999999');

      expect(result).toBe(false);
    });

    it('should return false for inactive room', () => {
      const questionSet = { questions: [mockQuestion1] };
      const inactiveRoomId = RoomService.createRoom('quiz-456', mockTeacherId, questionSet);

      const result = RoomService.moveToNextQuestion(inactiveRoomId);

      expect(result).toBe(false);
    });
  });

  describe('endQuestion', () => {
    beforeEach(() => {
      const questionSet = { questions: [mockQuestion1] };
      testRoomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
      RoomService.addPlayerToRoom(testRoomId, mockPlayer1);
      RoomService.addPlayerToRoom(testRoomId, mockPlayer2);
      RoomService.startQuiz(testRoomId);
    });

    it('should end current question', () => {
      RoomService.submitAnswer(testRoomId, 'socket-123', 2);

      const results = RoomService.endQuestion(testRoomId);

      expect(results).not.toBeNull();
      expect(results?.questionId).toBe(1);
    });

    it('should add null answers for players who did not answer', () => {
      RoomService.submitAnswer(testRoomId, 'socket-123', 2); // Only player 1 answers

      const results = RoomService.endQuestion(testRoomId);

      expect(results?.playerAnswers).toHaveLength(2);
      
      const player2Answer = results?.playerAnswers.find((p) => p.studentId === 'student-002');
      expect(player2Answer?.answerId).toBeNull();
      expect(player2Answer?.isCorrect).toBe(false);
    });

    it('should set questionEndedState to true', () => {
      RoomService.endQuestion(testRoomId);

      const room = RoomService.getRoom(testRoomId);
      expect(room?.questionEndedState).toBe(true);
    });

    it('should clear question start time', () => {
      RoomService.endQuestion(testRoomId);

      const room = RoomService.getRoom(testRoomId);
      expect(room?.questionStartTime).toBeNull();
    });

    it('should return results with correct structure', () => {
      RoomService.submitAnswer(testRoomId, 'socket-123', 2);
      RoomService.submitAnswer(testRoomId, 'socket-456', 0);

      const results = RoomService.endQuestion(testRoomId);

      expect(results).toMatchObject({
        questionId: 1,
        question: expect.any(String),
        options: expect.any(Array),
        correctAnswer: expect.any(Number),
        currentQuestionIndex: expect.any(Number),
        totalQuestions: expect.any(Number),
        playerAnswers: expect.arrayContaining([
          expect.objectContaining({
            playerId: expect.any(String),
            playerName: expect.any(String),
            studentId: expect.any(String),
            answerId: expect.any(Number),
            isCorrect: expect.any(Boolean),
            score: expect.any(Number),
            streak: expect.any(Number),
          }),
        ]),
      });
    });

    it('should return null for non-existent room', () => {
      const results = RoomService.endQuestion('999999');

      expect(results).toBeNull();
    });
  });

  describe('getActiveRooms', () => {
    it('should return empty object when no rooms exist', () => {
      const activeRooms = RoomService.getActiveRooms();

      expect(activeRooms).toEqual({});
    });

    it('should return all rooms', () => {
      const questionSet = { questions: [mockQuestion1] };
      const roomId1 = RoomService.createRoom('quiz-1', mockTeacherId, questionSet);
      const roomId2 = RoomService.createRoom('quiz-2', mockTeacherId, questionSet);

      const activeRooms = RoomService.getActiveRooms();

      expect(Object.keys(activeRooms)).toHaveLength(2);
      expect(activeRooms[roomId1]).toBeDefined();
      expect(activeRooms[roomId2]).toBeDefined();
    });

    it('should return room summaries with correct structure', () => {
      const questionSet = { questions: [mockQuestion1, mockQuestion2] };
      const roomId = RoomService.createRoom('quiz-123', mockTeacherId, questionSet);
      RoomService.addPlayerToRoom(roomId, mockPlayer1);

      const activeRooms = RoomService.getActiveRooms();

      expect(activeRooms[roomId]).toMatchObject({
        roomId,
        quizId: 'quiz-123',
        playerCount: 1,
        players: expect.any(Array),
        isActive: false,
        currentQuestionIndex: 0,
      });
    });
  });

  describe('Teacher session management', () => {
    it('should update teacher session', () => {
      RoomService.updateTeacherSession('teacher-socket-1', 'teacher-001');

      const session = RoomService.getTeacherSession('teacher-socket-1');
      expect(session).toBe('teacher-001');
    });

    it('should get teacher session', () => {
      RoomService.updateTeacherSession('teacher-socket-2', 'teacher-002');

      const session = RoomService.getTeacherSession('teacher-socket-2');
      expect(session).toBe('teacher-002');
    });

    it('should return undefined for non-existent session', () => {
      const session = RoomService.getTeacherSession('non-existent');

      expect(session).toBeUndefined();
    });

    it('should cleanup teacher session', () => {
      RoomService.updateTeacherSession('teacher-socket-3', 'teacher-003');
      RoomService.cleanupTeacherSession('teacher-socket-3');

      const session = RoomService.getTeacherSession('teacher-socket-3');
      expect(session).toBeUndefined();
    });
  });
});
