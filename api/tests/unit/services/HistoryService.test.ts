import HistoryService, { QuizHistory } from '../../../src/services/HistoryService';
import {
  mockQuestion1,
  mockQuestion2,
  mockQuestion3,
  createMockQuestion,
} from '../../helpers/mockData';

describe('HistoryService', () => {
  beforeEach(() => {
    // Clear history before each test using the new helper
    HistoryService.clearAllHistory();
  });

  afterEach(() => {
    // Cleanup after each test
    HistoryService.cleanup();
  });

  describe('saveQuizHistory', () => {
    it('should save quiz history with correct structure', () => {
      const roomData = {
        quizId: 'quiz-123',
        players: {
          'student-001': {
            socketId: 'socket-123',
            studentId: 'student-001',
            name: 'Alice',
            score: 150,
            streak: 2,
            answers: [
              {
                questionId: 1,
                answerId: 2,
                isCorrect: true,
                timeTaken: 10,
              },
              {
                questionId: 2,
                answerId: 1,
                isCorrect: true,
                timeTaken: 8,
              },
            ],
          },
          'student-002': {
            socketId: 'socket-456',
            studentId: 'student-002',
            name: 'Bob',
            score: 50,
            streak: 0,
            answers: [
              {
                questionId: 1,
                answerId: 0,
                isCorrect: false,
                timeTaken: 20,
              },
              {
                questionId: 2,
                answerId: 1,
                isCorrect: true,
                timeTaken: 12,
              },
            ],
          },
        },
        questions: {
          1: mockQuestion1,
          2: mockQuestion2,
        },
      };

      const history = HistoryService.saveQuizHistory('room-123', roomData, 'Test Quiz');

      expect(history).toBeDefined();
      expect(history.id).toBe('room-123');
      expect(history.roomId).toBe('room-123');
      expect(history.quizId).toBe('quiz-123');
      expect(history.quizName).toBe('Test Quiz');
      expect(history.playerCount).toBe(2);
      expect(history.dateCompleted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should create rankings sorted by score', () => {
      const roomData = {
        quizId: 'quiz-123',
        players: {
          'student-001': {
            socketId: 'socket-123',
            studentId: 'student-001',
            name: 'Alice',
            score: 50,
            streak: 0,
            answers: [],
          },
          'student-002': {
            socketId: 'socket-456',
            studentId: 'student-002',
            name: 'Bob',
            score: 150,
            streak: 2,
            answers: [],
          },
          'student-003': {
            socketId: 'socket-789',
            studentId: 'student-003',
            name: 'Charlie',
            score: 100,
            streak: 1,
            answers: [],
          },
        },
        questions: {},
      };

      const history = HistoryService.saveQuizHistory('room-123', roomData, 'Test Quiz');

      expect(history.rankings).toHaveLength(3);
      expect(history.rankings[0]).toMatchObject({
        rank: 1,
        playerName: 'Bob',
        studentId: 'student-002',
        score: 150,
      });
      expect(history.rankings[1]).toMatchObject({
        rank: 2,
        playerName: 'Charlie',
        studentId: 'student-003',
        score: 100,
      });
      expect(history.rankings[2]).toMatchObject({
        rank: 3,
        playerName: 'Alice',
        studentId: 'student-001',
        score: 50,
      });
    });

    it('should create detailed results for each player', () => {
      const roomData = {
        quizId: 'quiz-123',
        players: {
          'student-001': {
            socketId: 'socket-123',
            studentId: 'student-001',
            name: 'Alice',
            score: 100,
            streak: 1,
            answers: [
              {
                questionId: 1,
                answerId: 2,
                isCorrect: true,
                timeTaken: 10,
              },
            ],
          },
        },
        questions: {
          1: mockQuestion1,
        },
      };

      const history = HistoryService.saveQuizHistory('room-123', roomData, 'Test Quiz');

      expect(history.detailedResults).toHaveLength(1);
      expect(history.detailedResults[0]).toMatchObject({
        studentId: 'student-001',
        playerName: 'Alice',
        finalScore: 100,
        answers: expect.arrayContaining([
          expect.objectContaining({
            questionId: 1,
            answerId: 2,
            answerText: expect.any(String),
            isCorrect: true,
            timeTaken: 10,
            streakAfter: expect.any(Number),
            scoreAfter: expect.any(Number),
          }),
        ]),
      });
    });

    it('should handle null answers correctly', () => {
      const roomData = {
        quizId: 'quiz-123',
        players: {
          'student-001': {
            socketId: 'socket-123',
            studentId: 'student-001',
            name: 'Alice',
            score: 0,
            streak: 0,
            answers: [
              {
                questionId: 1,
                answerId: null,
                isCorrect: false,
                timeTaken: 30,
              },
            ],
          },
        },
        questions: {
          1: mockQuestion1,
        },
      };

      const history = HistoryService.saveQuizHistory('room-123', roomData, 'Test Quiz');

      expect(history.detailedResults[0].answers[0]).toMatchObject({
        questionId: 1,
        answerId: null,
        answerText: 'No Answer',
        isCorrect: false,
        timeTaken: 30,
      });
    });

    it('should calculate running score and streak correctly', () => {
      const roomData = {
        quizId: 'quiz-123',
        players: {
          'student-001': {
            socketId: 'socket-123',
            studentId: 'student-001',
            name: 'Alice',
            score: 200,
            streak: 2,
            answers: [
              {
                questionId: 1,
                answerId: 2,
                isCorrect: true,
                timeTaken: 10,
              },
              {
                questionId: 2,
                answerId: 1,
                isCorrect: true,
                timeTaken: 5,
              },
              {
                questionId: 3,
                answerId: 0,
                isCorrect: false,
                timeTaken: 20,
              },
            ],
          },
        },
        questions: {
          1: mockQuestion1,
          2: mockQuestion2,
          3: mockQuestion3,
        },
      };

      const history = HistoryService.saveQuizHistory('room-123', roomData, 'Test Quiz');
      const answers = history.detailedResults[0].answers;

      // First correct answer: streak should be 1
      expect(answers[0].isCorrect).toBe(true);
      expect(answers[0].streakAfter).toBe(1);

      // Second correct answer: streak should be 2
      expect(answers[1].isCorrect).toBe(true);
      expect(answers[1].streakAfter).toBe(2);

      // Incorrect answer: streak should reset to 0
      expect(answers[2].isCorrect).toBe(false);
      expect(answers[2].streakAfter).toBe(0);
    });

    it('should handle empty player list', () => {
      const roomData = {
        quizId: 'quiz-123',
        players: {},
        questions: {},
      };

      const history = HistoryService.saveQuizHistory('room-123', roomData, 'Empty Quiz');

      expect(history.playerCount).toBe(0);
      expect(history.rankings).toEqual([]);
      expect(history.detailedResults).toEqual([]);
    });

    it('should return the saved history', () => {
      const roomData = {
        quizId: 'quiz-123',
        players: {
          'student-001': {
            socketId: 'socket-123',
            studentId: 'student-001',
            name: 'Alice',
            score: 100,
            streak: 1,
            answers: [],
          },
        },
        questions: {},
      };

      const history = HistoryService.saveQuizHistory('room-123', roomData, 'Test Quiz');
      const retrieved = HistoryService.getHistoryById('room-123');

      expect(retrieved).toEqual(history);
    });
  });

  describe('getAllHistory', () => {
    it('should return empty array when no history exists', () => {
      const history = HistoryService.getAllHistory();

      expect(history).toEqual([]);
    });

    it('should return all saved histories', () => {
      const roomData1 = {
        quizId: 'quiz-1',
        players: {
          'student-001': {
            socketId: 'socket-123',
            studentId: 'student-001',
            name: 'Alice',
            score: 100,
            streak: 1,
            answers: [],
          },
        },
        questions: {},
      };

      const roomData2 = {
        quizId: 'quiz-2',
        players: {
          'student-002': {
            socketId: 'socket-456',
            studentId: 'student-002',
            name: 'Bob',
            score: 150,
            streak: 2,
            answers: [],
          },
        },
        questions: {},
      };

      HistoryService.saveQuizHistory('room-1', roomData1, 'Quiz 1');
      HistoryService.saveQuizHistory('room-2', roomData2, 'Quiz 2');

      const allHistory = HistoryService.getAllHistory();

      expect(allHistory).toHaveLength(2);
    });

    it('should return histories sorted by date (newest first)', () => {
      const roomData = {
        quizId: 'quiz-1',
        players: {},
        questions: {},
      };

      // Save with slight delay to ensure different timestamps
      HistoryService.saveQuizHistory('room-1', roomData, 'Quiz 1');
      
      // Wait a tiny bit
      const promise = new Promise(resolve => setTimeout(resolve, 10));
      
      return promise.then(() => {
        HistoryService.saveQuizHistory('room-2', roomData, 'Quiz 2');

        const allHistory = HistoryService.getAllHistory();

        expect(allHistory[0].roomId).toBe('room-2'); // Newest first
        expect(allHistory[1].roomId).toBe('room-1');
      });
    });
  });

  describe('getHistoryById', () => {
    beforeEach(() => {
      const roomData = {
        quizId: 'quiz-123',
        players: {
          'student-001': {
            socketId: 'socket-123',
            studentId: 'student-001',
            name: 'Alice',
            score: 100,
            streak: 1,
            answers: [],
          },
        },
        questions: {},
      };

      HistoryService.saveQuizHistory('room-123', roomData, 'Test Quiz');
    });

    it('should return history by ID', () => {
      const history = HistoryService.getHistoryById('room-123');

      expect(history).toBeDefined();
      expect(history?.id).toBe('room-123');
      expect(history?.quizName).toBe('Test Quiz');
    });

    it('should return undefined for non-existent history', () => {
      const history = HistoryService.getHistoryById('non-existent');

      expect(history).toBeUndefined();
    });
  });

  describe('deleteHistory', () => {
    beforeEach(() => {
      const roomData = {
        quizId: 'quiz-123',
        players: {},
        questions: {},
      };

      HistoryService.saveQuizHistory('room-123', roomData, 'Test Quiz');
    });

    it('should delete existing history', () => {
      const result = HistoryService.deleteHistory('room-123');

      expect(result).toBe(true);
      expect(HistoryService.getHistoryById('room-123')).toBeUndefined();
    });

    it('should return false when deleting non-existent history', () => {
      const result = HistoryService.deleteHistory('non-existent');

      expect(result).toBe(false);
    });

    it('should remove history from list', () => {
      HistoryService.deleteHistory('room-123');

      const allHistory = HistoryService.getAllHistory();
      expect(allHistory).toHaveLength(0);
    });
  });

  describe('Integration: Complete history lifecycle', () => {
    it('should handle save, retrieve, and delete flow', () => {
      const roomData = {
        quizId: 'quiz-123',
        players: {
          'student-001': {
            socketId: 'socket-123',
            studentId: 'student-001',
            name: 'Alice',
            score: 150,
            streak: 2,
            answers: [
              {
                questionId: 1,
                answerId: 2,
                isCorrect: true,
                timeTaken: 10,
              },
              {
                questionId: 2,
                answerId: 1,
                isCorrect: true,
                timeTaken: 8,
              },
            ],
          },
          'student-002': {
            socketId: 'socket-456',
            studentId: 'student-002',
            name: 'Bob',
            score: 50,
            streak: 0,
            answers: [
              {
                questionId: 1,
                answerId: 0,
                isCorrect: false,
                timeTaken: 20,
              },
              {
                questionId: 2,
                answerId: 1,
                isCorrect: true,
                timeTaken: 12,
              },
            ],
          },
        },
        questions: {
          1: mockQuestion1,
          2: mockQuestion2,
        },
      };

      // Save
      const savedHistory = HistoryService.saveQuizHistory('room-123', roomData, 'Complete Test Quiz');
      expect(savedHistory.id).toBe('room-123');

      // Retrieve by ID
      const retrievedById = HistoryService.getHistoryById('room-123');
      expect(retrievedById).toEqual(savedHistory);

      // Get all
      const allHistory = HistoryService.getAllHistory();
      expect(allHistory).toHaveLength(1);
      expect(allHistory[0]).toEqual(savedHistory);

      // Verify structure
      expect(retrievedById?.rankings).toHaveLength(2);
      expect(retrievedById?.rankings[0].playerName).toBe('Alice'); // Higher score
      expect(retrievedById?.detailedResults).toHaveLength(2);

      // Delete
      const deleteResult = HistoryService.deleteHistory('room-123');
      expect(deleteResult).toBe(true);

      // Verify deletion
      expect(HistoryService.getHistoryById('room-123')).toBeUndefined();
      expect(HistoryService.getAllHistory()).toHaveLength(0);
    });

    it('should handle multiple quiz histories', () => {
      const roomData = {
        quizId: 'quiz-1',
        players: {
          'student-001': {
            socketId: 'socket-123',
            studentId: 'student-001',
            name: 'Alice',
            score: 100,
            streak: 1,
            answers: [],
          },
        },
        questions: {},
      };

      // Save multiple histories
      HistoryService.saveQuizHistory('room-1', roomData, 'Quiz 1');
      HistoryService.saveQuizHistory('room-2', roomData, 'Quiz 2');
      HistoryService.saveQuizHistory('room-3', roomData, 'Quiz 3');

      // Verify all saved
      expect(HistoryService.getAllHistory()).toHaveLength(3);

      // Delete one
      HistoryService.deleteHistory('room-2');

      // Verify remaining
      const remaining = HistoryService.getAllHistory();
      expect(remaining).toHaveLength(2);
      expect(remaining.find((h) => h.id === 'room-2')).toBeUndefined();
      expect(remaining.find((h) => h.id === 'room-1')).toBeDefined();
      expect(remaining.find((h) => h.id === 'room-3')).toBeDefined();
    });
  });
});
