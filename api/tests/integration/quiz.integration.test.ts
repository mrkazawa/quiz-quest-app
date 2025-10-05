import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/testApp';
import QuizService from '../../src/services/QuizService';

describe('Quiz Management Integration Tests', () => {
  let app: Express;
  let teacherCookies: any;

  beforeAll(async () => {
    app = createTestApp();
    
    // Login as teacher for all tests
    const loginResponse = await request(app)
      .post('/api/verify-teacher')
      .send({ password: 'quizmaster123' });
    
    teacherCookies = loginResponse.headers['set-cookie'];
  });

  describe('GET /api/quizzes', () => {
    it('should return all available quizzes', async () => {
      const response = await request(app)
        .get('/api/quizzes')
        .set('Cookie', teacherCookies)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check quiz summary structure (getAllQuizzes returns QuizSummary, not full Quiz)
      const quiz = response.body[0];
      expect(quiz).toHaveProperty('id');
      expect(quiz).toHaveProperty('name');
      expect(quiz).toHaveProperty('description');
      expect(quiz).toHaveProperty('questionCount');
      expect(typeof quiz.questionCount).toBe('number');
    });

    it('should work without authentication (public endpoint)', async () => {
      const response = await request(app)
        .get('/api/quizzes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/create-quiz', () => {
    it('should create a quiz with valid data', async () => {
      const newQuiz = {
        setName: 'Integration Test Quiz',
        setDescription: 'A test quiz for integration testing',
        questions: [
          {
            id: 1,
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1,
            points: 100,
            timeLimit: 30,
          },
        ],
      };

      const response = await request(app)
        .post('/api/create-quiz')
        .set('Cookie', teacherCookies)
        .send(newQuiz)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.quizId).toBeDefined();
      expect(typeof response.body.quizId).toBe('string');
      expect(response.body.message).toBeDefined();
      
      // Verify quiz was actually created
      const quizId = response.body.quizId;
      const quiz = QuizService.getQuizById(quizId);
      expect(quiz).toBeDefined();
      expect(quiz?.name).toBe('Integration Test Quiz');
    });

    it('should return 401 when not authenticated', async () => {
      const newQuiz = {
        name: 'Test Quiz',
        description: 'Test',
        questions: [],
      };

      const response = await request(app)
        .post('/api/create-quiz')
        .send(newQuiz)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid quiz data', async () => {
      const invalidQuiz = {
        name: '',
        description: 'Test',
        // Missing questions
      };

      const response = await request(app)
        .post('/api/create-quiz')
        .set('Cookie', teacherCookies)
        .send(invalidQuiz)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/quiz/:quizId', () => {
    it('should delete an existing quiz', async () => {
      // First create a quiz
      const newQuiz = {
        setName: 'Quiz to Delete',
        setDescription: 'This quiz will be deleted',
        questions: [
          {
            id: 1,
            question: 'Test question',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            points: 100,
            timeLimit: 30,
          },
        ],
      };

      const createResponse = await request(app)
        .post('/api/create-quiz')
        .set('Cookie', teacherCookies)
        .send(newQuiz)
        .expect(200);

      expect(createResponse.body.success).toBe(true);
      const quizId = createResponse.body.quizId;

      // Now delete it
      const response = await request(app)
        .delete(`/api/quiz/${quizId}`)
        .set('Cookie', teacherCookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify quiz was deleted
      const quiz = QuizService.getQuizById(quizId);
      expect(quiz).toBeUndefined();
    });

    it('should return 404 for non-existent quiz', async () => {
      const response = await request(app)
        .delete('/api/quiz/non-existent-quiz')
        .set('Cookie', teacherCookies)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Quiz not found');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .delete('/api/quiz/some-quiz-id')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/quiz-template', () => {
    it('should download quiz template file', async () => {
      const response = await request(app)
        .get('/api/quiz-template')
        .expect(200);

      // Should return a file
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('template-quiz.json');
    });

    it('should work without authentication (public endpoint)', async () => {
      const response = await request(app)
        .get('/api/quiz-template')
        .expect(200);

      expect(response.headers['content-disposition']).toContain('template-quiz.json');
    });
  });

  describe('Quiz Management Flow', () => {
    it('should complete full quiz lifecycle: create -> verify -> delete', async () => {
      // 1. Create quiz
      const newQuiz = {
        setName: 'Lifecycle Test Quiz',
        setDescription: 'Testing full quiz lifecycle',
        questions: [
          {
            id: 1,
            question: 'Test question 1',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            points: 100,
            timeLimit: 30,
          },
          {
            id: 2,
            question: 'Test question 2',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 2,
            points: 150,
            timeLimit: 45,
          },
        ],
      };

      const createResponse = await request(app)
        .post('/api/create-quiz')
        .set('Cookie', teacherCookies)
        .send(newQuiz)
        .expect(200);

      expect(createResponse.body.success).toBe(true);
      const quizId = createResponse.body.quizId;

      // 2. Verify quiz exists in quiz list
      const listResponse = await request(app)
        .get('/api/quizzes')
        .set('Cookie', teacherCookies)
        .expect(200);

      const createdQuiz = listResponse.body.find((q: any) => q.id === quizId);
      expect(createdQuiz).toBeDefined();
      expect(createdQuiz.name).toBe('Lifecycle Test Quiz');
      expect(createdQuiz.questionCount).toBe(2);

      // 3. Delete quiz
      const deleteResponse = await request(app)
        .delete(`/api/quiz/${quizId}`)
        .set('Cookie', teacherCookies)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // 4. Verify quiz no longer exists
      const quiz = QuizService.getQuizById(quizId);
      expect(quiz).toBeUndefined();
    });
  });
});
