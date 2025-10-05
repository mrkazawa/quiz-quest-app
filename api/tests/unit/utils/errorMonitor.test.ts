import { errorMonitor, asyncHandler, socketErrorHandler } from '../../../src/utils/errorMonitor';
import { Request, Response, NextFunction } from 'express';
import { mockRequest, mockResponse } from '../../helpers/mockRequest';
import { Socket } from 'socket.io';

describe('ErrorMonitor', () => {
  beforeEach(() => {
    errorMonitor.resetStats();
  });

  describe('logError', () => {
    it('should log and count errors', () => {
      const error = new Error('Test error occurred');
      error.name = 'TestError';
      
      errorMonitor.logError(error);
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.uniqueErrors).toBe(1);
    });

    it('should increment count for repeated errors', () => {
      const error = new Error('Test error');
      error.name = 'TestError';
      
      errorMonitor.logError(error);
      errorMonitor.logError(error);
      errorMonitor.logError(error);
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.uniqueErrors).toBe(1);
    });

    it('should handle multiple error types', () => {
      const typeError = new TypeError('Type error occurred');
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      
      errorMonitor.logError(typeError);
      errorMonitor.logError(validationError);
      errorMonitor.logError(typeError);
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.uniqueErrors).toBe(2);
    });

    it('should include context information', () => {
      const error = new Error('Context test');
      const context = { userId: '123', action: 'test' };
      
      const logEntry = errorMonitor.logError(error, context);
      
      expect(logEntry.context).toEqual(context);
      expect(logEntry.error.message).toBe('Context test');
    });
  });

  describe('getErrorStats', () => {
    it('should return empty stats initially', () => {
      const stats = errorMonitor.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.uniqueErrors).toBe(0);
      expect(stats.topErrors).toEqual([]);
    });

    it('should return accurate statistics', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      errorMonitor.logError(error1);
      errorMonitor.logError(error2);
      errorMonitor.logError(error1);
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.totalErrors).toBe(3);
      expect(stats.uniqueErrors).toBe(2);
      expect(stats.topErrors.length).toBe(2);
      expect(stats.topErrors[0].count).toBe(2); // error1 is most frequent
    });

    it('should include uptime information', () => {
      const stats = errorMonitor.getErrorStats();
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('resetStats', () => {
    it('should clear all error statistics', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      errorMonitor.logError(error1);
      errorMonitor.logError(error2);
      
      let stats = errorMonitor.getErrorStats();
      expect(stats.totalErrors).toBe(2);
      
      errorMonitor.resetStats();
      
      stats = errorMonitor.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.uniqueErrors).toBe(0);
    });

    it('should allow logging after reset', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      errorMonitor.logError(error1);
      errorMonitor.resetStats();
      errorMonitor.logError(error2);
      
      const stats = errorMonitor.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      expect(stats.uniqueErrors).toBe(1);
    });
  });
});

describe('asyncHandler', () => {
  let mockReq: Request;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = mockRequest() as Request;
    mockRes = mockResponse();
    mockNext = jest.fn();
    errorMonitor.resetStats();
  });

  it('should execute successful async function', async () => {
    const asyncFn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      res.status!(200).json({ success: true });
    });

    await asyncFn(mockReq, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('should catch errors and pass to next', async () => {
    const testError = new Error('Test error');
    const asyncFn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      throw testError;
    });

    await asyncFn(mockReq, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(testError);
  });

  it('should handle Promise rejection', async () => {
    const testError = new Error('Promise rejected');
    const asyncFn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      throw testError; // Use throw instead of Promise.reject
    });

    await asyncFn(mockReq, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(testError);
  });

  it('should log errors with request context', async () => {
    const testError = new Error('Context test');
    mockReq.method = 'POST';
    mockReq.url = '/api/test';
    
    const asyncFn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      throw testError;
    });

    await asyncFn(mockReq, mockRes as Response, mockNext);

    const stats = errorMonitor.getErrorStats();
    expect(stats.totalErrors).toBe(1);
  });
});

describe('socketErrorHandler', () => {
  beforeEach(() => {
    errorMonitor.resetStats();
  });

  it('should execute handler successfully without errors', () => {
    const mockSocket = { id: 'socket-123', emit: jest.fn() } as unknown as Socket;
    const handler = socketErrorHandler((socket: Socket, data: any) => {
      socket.emit('success', { message: 'Done' });
    });

    handler(mockSocket, { test: 'data' });

    expect(mockSocket.emit).toHaveBeenCalledWith('success', { message: 'Done' });
  });

  it('should re-throw errors after logging', () => {
    const mockSocket = { id: 'socket-123', emit: jest.fn() } as unknown as Socket;
    const handler = socketErrorHandler((socket: Socket, data: any) => {
      throw new Error('Handler error');
    });

    expect(() => {
      handler(mockSocket, { test: 'data' });
    }).toThrow('Handler error');
  });

  it('should log errors with socket context', () => {
    const mockSocket = { id: 'socket-123', emit: jest.fn() } as unknown as Socket;
    const handler = socketErrorHandler((socket: Socket) => {
      throw new Error('Socket error');
    });

    expect(() => {
      handler(mockSocket);
    }).toThrow();

    const stats = errorMonitor.getErrorStats();
    expect(stats.totalErrors).toBe(1);
  });

  it('should pass arguments to handler correctly', () => {
    const mockSocket = { id: 'socket-123', emit: jest.fn() } as unknown as Socket;
    const mockHandler = jest.fn();
    const handler = socketErrorHandler(mockHandler);
    const testData = { id: 123, name: 'test' };

    handler(mockSocket, testData);

    expect(mockHandler).toHaveBeenCalledWith(mockSocket, testData);
  });
});
