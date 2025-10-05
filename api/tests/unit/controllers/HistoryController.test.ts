import HistoryController from '../../../src/controllers/HistoryController';
import HistoryService from '../../../src/services/HistoryService';
import { mockRequest, mockResponse, mockTeacherRequest, mockUnauthenticatedRequest } from '../../helpers/mockRequest';
import { Response } from 'express';
import { AuthenticatedRequest } from '../../../src/types/express';

// Mock the HistoryService
jest.mock('../../../src/services/HistoryService');

describe('HistoryController', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = mockResponse();
  });

  describe('getAllHistory', () => {
    it('should return all history for authenticated teacher', async () => {
      const mockHistoryList = [
        {
          roomId: 'room-1',
          quizId: 'quiz-1',
          quizName: 'Math Quiz',
          completedAt: Date.now(),
          rankings: [],
        },
        {
          roomId: 'room-2',
          quizId: 'quiz-2',
          quizName: 'Science Quiz',
          completedAt: Date.now(),
          rankings: [],
        },
      ];

      (HistoryService.getAllHistory as jest.Mock).mockReturnValue(mockHistoryList);

      const mockReq = mockTeacherRequest();
      await HistoryController.getAllHistory(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(HistoryService.getAllHistory).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockHistoryList);
    });

    it('should return empty array when no history exists', async () => {
      (HistoryService.getAllHistory as jest.Mock).mockReturnValue([]);

      const mockReq = mockTeacherRequest();
      await HistoryController.getAllHistory(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('should reject request without teacher authentication', async () => {
      const mockReq = mockUnauthenticatedRequest();

      await HistoryController.getAllHistory(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(HistoryService.getAllHistory).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should reject request without session', async () => {
      const mockReq = mockRequest();
      mockReq.session = undefined;

      await HistoryController.getAllHistory(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(HistoryService.getAllHistory).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should handle service errors', async () => {
      (HistoryService.getAllHistory as jest.Mock).mockImplementation(() => {
        throw new Error('Service error');
      });

      const mockReq = mockTeacherRequest();
      await HistoryController.getAllHistory(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to retrieve quiz history' });
    });
  });

  describe('getHistoryById', () => {
    it('should return specific history for authenticated teacher', async () => {
      const historyId = 'room-1';
      const mockHistory = {
        roomId: 'room-1',
        quizId: 'quiz-1',
        quizName: 'Math Quiz',
        completedAt: Date.now(),
        rankings: [
          { name: 'Student 1', score: 100 },
          { name: 'Student 2', score: 80 },
        ],
      };

      (HistoryService.getHistoryById as jest.Mock).mockReturnValue(mockHistory);

      const mockReq = mockTeacherRequest({ params: { historyId } });
      await HistoryController.getHistoryById(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(HistoryService.getHistoryById).toHaveBeenCalledWith(historyId);
      expect(mockRes.json).toHaveBeenCalledWith(mockHistory);
    });

    it('should return 404 when history not found', async () => {
      const historyId = 'non-existent';

      (HistoryService.getHistoryById as jest.Mock).mockReturnValue(null);

      const mockReq = mockTeacherRequest({ params: { historyId } });
      await HistoryController.getHistoryById(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'History not found' });
    });

    it('should reject request without teacher authentication', async () => {
      const mockReq = mockUnauthenticatedRequest({ params: { historyId: 'room-1' } });

      await HistoryController.getHistoryById(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(HistoryService.getHistoryById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should reject request without session', async () => {
      const mockReq = mockRequest({ params: { historyId: 'room-1' } });
      mockReq.session = undefined;

      await HistoryController.getHistoryById(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(HistoryService.getHistoryById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should handle service errors', async () => {
      (HistoryService.getHistoryById as jest.Mock).mockImplementation(() => {
        throw new Error('Service error');
      });

      const mockReq = mockTeacherRequest({ params: { historyId: 'room-1' } });
      await HistoryController.getHistoryById(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to retrieve quiz history detail' });
    });
  });
});
