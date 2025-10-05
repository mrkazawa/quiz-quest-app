import QuizController from '../../../src/controllers/QuizController';
import QuizService from '../../../src/services/QuizService';
import { mockRequest, mockResponse, mockTeacherRequest, mockUnauthenticatedRequest } from '../../helpers/mockRequest';
import { Response } from 'express';
import { AuthenticatedRequest } from '../../../src/types/express';

// Mock the QuizService
jest.mock('../../../src/services/QuizService');

describe('QuizController', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = mockResponse();
  });

  describe('getAllQuizzes', () => {
    it('should return all quizzes successfully', async () => {
      const mockQuizzes = [
        { id: 'quiz-1', name: 'Quiz 1', questions: [] },
        { id: 'quiz-2', name: 'Quiz 2', questions: [] },
      ];

      (QuizService.getAllQuizzes as jest.Mock).mockReturnValue(mockQuizzes);

      const mockReq = mockRequest();
      await QuizController.getAllQuizzes(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(QuizService.getAllQuizzes).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockQuizzes);
    });

    it('should return empty array when no quizzes exist', async () => {
      (QuizService.getAllQuizzes as jest.Mock).mockReturnValue([]);

      const mockReq = mockRequest();
      await QuizController.getAllQuizzes(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('should handle service errors', async () => {
      (QuizService.getAllQuizzes as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const mockReq = mockRequest();
      await QuizController.getAllQuizzes(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to retrieve quizzes' });
    });
  });

  describe('createQuiz', () => {
    it('should create quiz successfully with valid teacher session', async () => {
      const quizData = {
        name: 'New Quiz',
        description: 'Test quiz',
        questions: [
          {
            id: 'q1',
            text: 'Question 1',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
          },
        ],
      };

      const mockResult = {
        id: 'quiz-123',
        filePath: '/path/to/quiz.json',
      };

      (QuizService.validateQuizData as jest.Mock).mockReturnValue(true);
      (QuizService.createQuiz as jest.Mock).mockReturnValue(mockResult);

      const mockReq = mockTeacherRequest({ body: quizData });
      await QuizController.createQuiz(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(QuizService.validateQuizData).toHaveBeenCalledWith(quizData);
      expect(QuizService.createQuiz).toHaveBeenCalledWith(quizData);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
    });

    it('should reject quiz creation without teacher authentication', async () => {
      const quizData = { name: 'New Quiz', questions: [] };
      const mockReq = mockUnauthenticatedRequest({ body: quizData });

      await QuizController.createQuiz(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(QuizService.createQuiz).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should reject quiz creation without session', async () => {
      const quizData = { name: 'New Quiz', questions: [] };
      const mockReq = mockRequest({ body: quizData });
      mockReq.session = undefined;

      await QuizController.createQuiz(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(QuizService.createQuiz).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should handle validation errors', async () => {
      const invalidQuizData = { name: 'Invalid Quiz' };

      (QuizService.validateQuizData as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid quiz data: missing questions');
      });

      const mockReq = mockTeacherRequest({ body: invalidQuizData });
      await QuizController.createQuiz(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid quiz data: missing questions',
      });
    });

    it('should handle service errors during creation', async () => {
      const quizData = { name: 'New Quiz', questions: [] };

      (QuizService.validateQuizData as jest.Mock).mockReturnValue(true);
      (QuizService.createQuiz as jest.Mock).mockImplementation(() => {
        throw new Error('File system error');
      });

      const mockReq = mockTeacherRequest({ body: quizData });
      await QuizController.createQuiz(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'File system error',
      });
    });
  });

  describe('deleteQuiz', () => {
    it('should delete quiz successfully with valid teacher session', async () => {
      const quizId = 'quiz-123';
      const mockResult = { message: 'Quiz deleted successfully' };

      (QuizService.deleteQuiz as jest.Mock).mockReturnValue(mockResult);

      const mockReq = mockTeacherRequest({ params: { quizId } });
      await QuizController.deleteQuiz(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(QuizService.deleteQuiz).toHaveBeenCalledWith(quizId);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
    });

    it('should reject quiz deletion without teacher authentication', async () => {
      const mockReq = mockUnauthenticatedRequest({ params: { quizId: 'quiz-123' } });

      await QuizController.deleteQuiz(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(QuizService.deleteQuiz).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should return 404 when quiz not found', async () => {
      const quizId = 'non-existent-quiz';

      (QuizService.deleteQuiz as jest.Mock).mockImplementation(() => {
        throw new Error('Quiz not found');
      });

      const mockReq = mockTeacherRequest({ params: { quizId } });
      await QuizController.deleteQuiz(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Quiz not found',
      });
    });

    it('should handle internal server errors', async () => {
      const quizId = 'quiz-123';

      (QuizService.deleteQuiz as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const mockReq = mockTeacherRequest({ params: { quizId } });
      await QuizController.deleteQuiz(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('downloadTemplate', () => {
    it('should download template file successfully', async () => {
      const mockReq = mockRequest();
      await QuizController.downloadTemplate(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.download).toHaveBeenCalled();
      const downloadCall = (mockRes.download as jest.Mock).mock.calls[0];
      expect(downloadCall[0]).toContain('template-quiz.json');
      expect(downloadCall[1]).toBe('template-quiz.json');
    });

    it('should handle errors when template download fails', async () => {
      const mockReq = mockRequest();
      (mockRes.download as jest.Mock) = jest.fn((path: string, filename: string, callback?: any) => {
        if (callback) {
          callback(new Error('File not found'));
        }
        return mockRes as Response;
      });

      await QuizController.downloadTemplate(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Template file not found' });
    });
  });
});
