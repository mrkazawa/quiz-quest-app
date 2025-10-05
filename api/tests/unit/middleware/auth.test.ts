import { requireTeacherAuth } from '../../../src/middleware/auth';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../src/types/express';
import { mockRequest, mockResponse, mockTeacherRequest, mockUnauthenticatedRequest } from '../../helpers/mockRequest';

describe('Auth Middleware', () => {
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRes = mockResponse();
    mockNext = jest.fn();
  });

  describe('requireTeacherAuth', () => {
    it('should call next() when user is authenticated as teacher', () => {
      const mockReq = mockTeacherRequest();

      requireTeacherAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      const mockReq = mockUnauthenticatedRequest();

      requireTeacherAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should return 401 when session is undefined', () => {
      const mockReq = mockRequest();
      mockReq.session = undefined;

      requireTeacherAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should return 401 when isTeacher is false', () => {
      const mockReq = mockRequest({ session: { isTeacher: false } });

      requireTeacherAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should return 401 when isTeacher is not a boolean', () => {
      const mockReq = mockRequest({ session: { isTeacher: 'true' } });

      requireTeacherAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });
  });
});
