import { Request, Response, NextFunction } from 'express';
import { securityHeaders, healthCheck } from '../../../src/middleware/logging';
import { mockRequest, mockResponse } from '../../helpers/mockRequest';

describe('Logging Middleware', () => {
  describe('securityHeaders', () => {
    let mockReq: Request;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockReq = mockRequest() as Request;
      mockRes = mockResponse();
      mockNext = jest.fn();
    });

    it('should remove X-Powered-By header', () => {
      securityHeaders(mockReq, mockRes as Response, mockNext);

      expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    });

    it('should add X-Content-Type-Options header', () => {
      securityHeaders(mockReq, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    });

    it('should add X-Frame-Options header', () => {
      securityHeaders(mockReq, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    });

    it('should add X-XSS-Protection header', () => {
      securityHeaders(mockReq, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    });

    it('should add HSTS header in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      securityHeaders(mockReq, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not add HSTS header in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      securityHeaders(mockReq, mockRes as Response, mockNext);

      const hstsCalls = (mockRes.setHeader as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'Strict-Transport-Security'
      );
      expect(hstsCalls.length).toBe(0);

      process.env.NODE_ENV = originalEnv;
    });

    it('should call next()', () => {
      securityHeaders(mockReq, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    let mockReq: Request;
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockReq = mockRequest() as Request;
      mockRes = mockResponse();
    });

    it('should return 200 status', () => {
      healthCheck(mockReq, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return health status', () => {
      healthCheck(mockReq, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalled();
      const response = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(response.status).toBe('healthy');
    });

    it('should include timestamp', () => {
      healthCheck(mockReq, mockRes as Response);

      const response = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(response.timestamp).toBeDefined();
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include uptime', () => {
      healthCheck(mockReq, mockRes as Response);

      const response = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(response.uptime).toBeDefined();
      expect(typeof response.uptime).toBe('number');
    });

    it('should include memory usage', () => {
      healthCheck(mockReq, mockRes as Response);

      const response = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(response.memory).toBeDefined();
      expect(response.memory.heapUsed).toBeDefined();
      expect(response.memory.heapTotal).toBeDefined();
    });

    it('should include environment', () => {
      healthCheck(mockReq, mockRes as Response);

      const response = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(response.env).toBeDefined();
    });
  });
});
