import RoomController from '../../../src/controllers/RoomController';
import RoomService from '../../../src/services/RoomService';
import QuizService from '../../../src/services/QuizService';
import { mockTeacherRequest, mockUnauthenticatedRequest, mockResponse, mockRequest } from '../../helpers/mockRequest';
import { Response } from 'express';
import { AuthenticatedRequest } from '../../../src/types/express';

// Mock the services
jest.mock('../../../src/services/RoomService');
jest.mock('../../../src/services/QuizService');

describe('RoomController', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = mockResponse();
  });

  describe('getActiveRooms', () => {
    it('should return active rooms with quiz names for authenticated teacher', async () => {
      const mockRooms = {
        'room-1': {
          id: 'room-1',
          quizId: 'quiz-1',
          roomCode: '123456',
          isActive: true,
          players: {},
        },
        'room-2': {
          id: 'room-2',
          quizId: 'quiz-2',
          roomCode: '654321',
          isActive: true,
          players: {},
        },
      };

      const mockQuiz1 = { id: 'quiz-1', name: 'Genshin Impact Quiz' };
      const mockQuiz2 = { id: 'quiz-2', name: 'Math Quiz' };

      (RoomService.getActiveRooms as jest.Mock).mockReturnValue(mockRooms);
      (QuizService.getQuizById as jest.Mock)
        .mockReturnValueOnce(mockQuiz1)
        .mockReturnValueOnce(mockQuiz2);

      const mockReq = mockTeacherRequest();
      await RoomController.getActiveRooms(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(RoomService.getActiveRooms).toHaveBeenCalled();
      expect(QuizService.getQuizById).toHaveBeenCalledWith('quiz-1');
      expect(QuizService.getQuizById).toHaveBeenCalledWith('quiz-2');
      expect(mockRes.json).toHaveBeenCalled();

      const responseData = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseData['room-1'].quizName).toBe('Genshin Impact Quiz');
      expect(responseData['room-2'].quizName).toBe('Math Quiz');
    });

    it('should use quizId as fallback when quiz not found', async () => {
      const mockRooms = {
        'room-1': {
          id: 'room-1',
          quizId: 'non-existent-quiz',
          roomCode: '123456',
          isActive: true,
          players: {},
        },
      };

      (RoomService.getActiveRooms as jest.Mock).mockReturnValue(mockRooms);
      (QuizService.getQuizById as jest.Mock).mockReturnValue(null);

      const mockReq = mockTeacherRequest();
      await RoomController.getActiveRooms(mockReq as AuthenticatedRequest, mockRes as Response);

      const responseData = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(responseData['room-1'].quizName).toBe('non-existent-quiz');
    });

    it('should return empty object when no active rooms', async () => {
      (RoomService.getActiveRooms as jest.Mock).mockReturnValue({});

      const mockReq = mockTeacherRequest();
      await RoomController.getActiveRooms(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({});
    });

    it('should reject request without teacher authentication', async () => {
      const mockReq = mockUnauthenticatedRequest();

      await RoomController.getActiveRooms(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(RoomService.getActiveRooms).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should reject request without session', async () => {
      const mockReq = mockRequest();
      mockReq.session = undefined;

      await RoomController.getActiveRooms(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(RoomService.getActiveRooms).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should handle service errors', async () => {
      (RoomService.getActiveRooms as jest.Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const mockReq = mockTeacherRequest();
      await RoomController.getActiveRooms(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to retrieve active rooms' });
    });

    it('should handle errors from QuizService', async () => {
      const mockRooms = {
        'room-1': {
          id: 'room-1',
          quizId: 'quiz-1',
          roomCode: '123456',
          isActive: true,
          players: {},
        },
      };

      (RoomService.getActiveRooms as jest.Mock).mockReturnValue(mockRooms);
      (QuizService.getQuizById as jest.Mock).mockImplementation(() => {
        throw new Error('Quiz service error');
      });

      const mockReq = mockTeacherRequest();
      await RoomController.getActiveRooms(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to retrieve active rooms' });
    });
  });
});
