import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import { Express } from 'express';
import HistoryService from '../../src/services/HistoryService';

describe('History Integration Tests', () => {
  let app: Express;
  let teacherCookies: string[];

  beforeAll(async () => {
    app = createTestApp();

    // Login as teacher
    const loginResponse = await request(app)
      .post('/api/verify-teacher')
      .send({ password: 'quizmaster123' })
      .expect(200);

    const setCookie = loginResponse.headers['set-cookie'];
    teacherCookies = Array.isArray(setCookie) ? setCookie : [];

    // Clear existing history before tests
    HistoryService.clearAllHistory();
  });

  afterAll(() => {
    // Clean up after tests
    HistoryService.clearAllHistory();
  });

  describe('GET /api/quiz-history', () => {
    it('should return empty array when no history exists', async () => {
      const response = await request(app)
        .get('/api/quiz-history')
        .set('Cookie', teacherCookies)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return history records when they exist', async () => {
      // Add a test history record directly to the service
      HistoryService.saveQuizHistory(
        'test-room-123',
        {
          quizId: 'genshin-impact-quiz',
          questions: {
            1: {
              id: 1,
              question: 'Test question',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
              points: 100,
              timeLimit: 30,
            },
          },
          players: {
            player1: {
              socketId: 'socket-1',
              studentId: 'student-1',
              name: 'Alice',
              score: 100,
              streak: 1,
              answers: [
                {
                  questionId: 1,
                  answerId: 0,
                  isCorrect: true,
                  timeTaken: 10,
                },
              ],
            },
            player2: {
              socketId: 'socket-2',
              studentId: 'student-2',
              name: 'Bob',
              score: 50,
              streak: 0,
              answers: [
                {
                  questionId: 1,
                  answerId: 1,
                  isCorrect: false,
                  timeTaken: 15,
                },
              ],
            },
          },
        },
        'Genshin Impact Quiz'
      );

      const response = await request(app)
        .get('/api/quiz-history')
        .set('Cookie', teacherCookies)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const record = response.body[0];
      expect(record).toHaveProperty('roomId', 'test-room-123');
      expect(record).toHaveProperty('quizId', 'genshin-impact-quiz');
      expect(record).toHaveProperty('quizName', 'Genshin Impact Quiz');
      expect(record).toHaveProperty('playerCount', 2);
      expect(record).toHaveProperty('rankings');
      expect(Array.isArray(record.rankings)).toBe(true);
      expect(record.rankings.length).toBe(2);
    });

    it('should return 403 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/quiz-history')
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/quiz-history/:historyId', () => {
    it('should get history details by ID', async () => {
      // Add a history record
      HistoryService.saveQuizHistory(
        'test-room-789',
        {
          quizId: 'test-quiz-id',
          questions: {},
          players: {},
        },
        'Detailed Test Quiz'
      );

      const response = await request(app)
        .get('/api/quiz-history/test-room-789')
        .set('Cookie', teacherCookies)
        .expect(200);

      expect(response.body).toHaveProperty('id', 'test-room-789');
      expect(response.body).toHaveProperty('roomId', 'test-room-789');
      expect(response.body).toHaveProperty('quizName', 'Detailed Test Quiz');
    });

    it('should return 404 for non-existent history', async () => {
      const response = await request(app)
        .get('/api/quiz-history/non-existent-id')
        .set('Cookie', teacherCookies)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('History Flow', () => {
    it('should complete full history lifecycle: add -> list -> get', async () => {
      // 1. Clear existing history
      HistoryService.clearAllHistory();

      // 2. Verify history is empty
      const emptyResponse = await request(app)
        .get('/api/quiz-history')
        .set('Cookie', teacherCookies)
        .expect(200);

      expect(emptyResponse.body.length).toBe(0);

      // 3. Add multiple history records
      HistoryService.saveQuizHistory(
        'room-1',
        {
          quizId: 'quiz-1',
          questions: {},
          players: {},
        },
        'Quiz One'
      );

      HistoryService.saveQuizHistory(
        'room-2',
        {
          quizId: 'quiz-2',
          questions: {},
          players: {},
        },
        'Quiz Two'
      );

      // 4. List history and verify both records exist
      const listResponse = await request(app)
        .get('/api/quiz-history')
        .set('Cookie', teacherCookies)
        .expect(200);

      expect(listResponse.body.length).toBe(2);
      // Note: History is sorted by date descending
      // Both were created in quick succession, so order might vary slightly
      const roomIds = listResponse.body.map((r: any) => r.roomId).sort();
      expect(roomIds).toEqual(['room-1', 'room-2']);

      // 5. Get individual history record
      const detailResponse = await request(app)
        .get('/api/quiz-history/room-1')
        .set('Cookie', teacherCookies)
        .expect(200);

      expect(detailResponse.body.roomId).toBe('room-1');
      expect(detailResponse.body.quizName).toBe('Quiz One');

      // 6. Clear history for next test
      HistoryService.clearAllHistory();
    });
  });
});
