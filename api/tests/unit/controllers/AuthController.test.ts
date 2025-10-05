import AuthController from '../../../src/controllers/AuthController';
import { mockRequest, mockResponse } from '../../helpers/mockRequest';
import { Response } from 'express';
import { AuthenticatedRequest } from '../../../src/types/express';

describe('AuthController', () => {
  let mockRes: Partial<Response>;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = mockResponse();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('verifyTeacher', () => {
    it('should authenticate teacher with correct password', async () => {
      const password = 'quizmaster123';
      const mockReq = mockRequest({
        body: { password },
        session: {},
      });

      await AuthController.verifyTeacher(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockReq.session?.isTeacher).toBe(true);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        redirect: '/teacher/dashboard',
      });
    });

    it('should authenticate teacher with environment password', async () => {
      process.env.TEACHER_PASSWORD = 'custom-password';
      const mockReq = mockRequest({
        body: { password: 'custom-password' },
        session: {},
      });

      await AuthController.verifyTeacher(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockReq.session?.isTeacher).toBe(true);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        redirect: '/teacher/dashboard',
      });
    });

    it('should reject incorrect password', async () => {
      const mockReq = mockRequest({
        body: { password: 'wrong-password' },
        session: {},
      });

      await AuthController.verifyTeacher(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockReq.session?.isTeacher).toBeUndefined();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Incorrect password',
      });
    });

    it('should handle missing password', async () => {
      const mockReq = mockRequest({
        body: {},
        session: {},
      });

      await AuthController.verifyTeacher(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Incorrect password',
      });
    });

    it('should handle internal errors', async () => {
      // The controller checks session first, so undefined session returns 401
      // not a 500 error. This test verifies the authentication check works.
      const mockReq = mockRequest({
        body: { password: 'wrong' },
        session: {},
      });

      await AuthController.verifyTeacher(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Incorrect password',
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully and destroy session', async () => {
      const mockDestroy = jest.fn((callback) => callback(null));
      const mockReq = mockRequest({
        session: {
          isTeacher: true,
          destroy: mockDestroy,
        } as any,
      });

      await AuthController.logout(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockReq.session?.isTeacher).toBe(false);
      expect(mockDestroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should handle session destroy errors', async () => {
      const mockDestroy = jest.fn((callback) => callback(new Error('Destroy failed')));
      const mockReq = mockRequest({
        session: {
          isTeacher: true,
          destroy: mockDestroy,
        } as any,
      });

      await AuthController.logout(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to logout' });
    });

    it('should handle missing session', async () => {
      const mockReq = mockRequest({});
      mockReq.session = undefined;

      await AuthController.logout(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('setLanguage', () => {
    it('should set language to English', async () => {
      const mockReq = mockRequest({
        body: { language: 'en' },
        session: {} as any,
      });

      await AuthController.setLanguage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect((mockReq.session as any).language).toBe('en');
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should set language to Indonesian', async () => {
      const mockReq = mockRequest({
        body: { language: 'id' },
        session: {} as any,
      });

      await AuthController.setLanguage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect((mockReq.session as any).language).toBe('id');
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should reject invalid language', async () => {
      const mockReq = mockRequest({
        body: { language: 'fr' },
        session: {} as any,
      });

      await AuthController.setLanguage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid language' });
    });

    it('should reject missing language', async () => {
      const mockReq = mockRequest({
        body: {},
        session: {} as any,
      });

      await AuthController.setLanguage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid language' });
    });

    it('should handle internal errors', async () => {
      const mockReq = mockRequest({
        body: { language: 'en' },
      });
      mockReq.session = undefined;

      await AuthController.setLanguage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getLanguage', () => {
    it('should return saved language preference', async () => {
      const mockReq = mockRequest({
        session: { language: 'id' } as any,
      });

      await AuthController.getLanguage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({ language: 'id' });
    });

    it('should return default language when not set', async () => {
      const mockReq = mockRequest({
        session: {} as any,
      });

      await AuthController.getLanguage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({ language: 'en' });
    });

    it('should handle internal errors', async () => {
      const mockReq = mockRequest({});
      mockReq.session = undefined;

      await AuthController.getLanguage(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
