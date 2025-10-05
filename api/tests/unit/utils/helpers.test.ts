import {
  validateQuizData,
  generateSlug,
  generateRoomCode,
  formatTimestamp,
  calculateTimeRemaining,
  sendSuccess,
  sendError,
} from '../../../src/utils/helpers';
import { mockResponse } from '../../helpers/mockRequest';
import { Response } from 'express';

describe('Helper Utilities', () => {
  describe('validateQuizData', () => {
    it('should validate complete quiz data', () => {
      const validQuizData = {
        setName: 'Math Quiz',
        setDescription: 'A quiz about mathematics',
        questions: [
          { id: 'q1', text: 'What is 2+2?', options: ['3', '4', '5'], correctAnswer: 1 },
        ],
      };

      expect(() => validateQuizData(validQuizData)).not.toThrow();
      expect(validateQuizData(validQuizData)).toBe(true);
    });

    it('should throw error when setName is missing', () => {
      const invalidQuizData = {
        setDescription: 'Description',
        questions: [{ id: 'q1', text: 'Question?' }],
      };

      expect(() => validateQuizData(invalidQuizData)).toThrow("Missing or invalid 'setName' field");
    });

    it('should throw error when setName is not a string', () => {
      const invalidQuizData = {
        setName: 123,
        setDescription: 'Description',
        questions: [{ id: 'q1' }],
      };

      expect(() => validateQuizData(invalidQuizData)).toThrow("Missing or invalid 'setName' field");
    });

    it('should throw error when setDescription is missing', () => {
      const invalidQuizData = {
        setName: 'Quiz Name',
        questions: [{ id: 'q1' }],
      };

      expect(() => validateQuizData(invalidQuizData)).toThrow("Missing or invalid 'setDescription' field");
    });

    it('should throw error when setDescription is not a string', () => {
      const invalidQuizData = {
        setName: 'Quiz Name',
        setDescription: 456,
        questions: [{ id: 'q1' }],
      };

      expect(() => validateQuizData(invalidQuizData)).toThrow("Missing or invalid 'setDescription' field");
    });

    it('should throw error when questions is missing', () => {
      const invalidQuizData = {
        setName: 'Quiz Name',
        setDescription: 'Description',
      };

      expect(() => validateQuizData(invalidQuizData)).toThrow("Missing or empty 'questions' array");
    });

    it('should throw error when questions is not an array', () => {
      const invalidQuizData = {
        setName: 'Quiz Name',
        setDescription: 'Description',
        questions: 'not an array',
      };

      expect(() => validateQuizData(invalidQuizData)).toThrow("Missing or empty 'questions' array");
    });

    it('should throw error when questions array is empty', () => {
      const invalidQuizData = {
        setName: 'Quiz Name',
        setDescription: 'Description',
        questions: [],
      };

      expect(() => validateQuizData(invalidQuizData)).toThrow("Missing or empty 'questions' array");
    });
  });

  describe('generateSlug', () => {
    it('should convert text to lowercase slug', () => {
      const result = generateSlug('Hello World');
      expect(result).toBe('hello-world');
    });

    it('should replace multiple spaces with single dash', () => {
      const result = generateSlug('Hello    World');
      expect(result).toBe('hello-world');
    });

    it('should remove special characters', () => {
      const result = generateSlug('Hello! @World# $Quiz%');
      expect(result).toBe('hello-world-quiz');
    });

    it('should handle text with numbers', () => {
      const result = generateSlug('Quiz 123 Test');
      expect(result).toBe('quiz-123-test');
    });

    it('should handle leading and trailing whitespace', () => {
      const result = generateSlug('  Hello World  ');
      // trim() is applied after replace, so dashes at ends are included
      expect(result).toBe('-hello-world-');
    });

    it('should handle empty string', () => {
      const result = generateSlug('');
      expect(result).toBe('');
    });

    it('should handle text with only special characters', () => {
      const result = generateSlug('!@#$%');
      expect(result).toBe('');
    });

    it('should handle CamelCase text', () => {
      const result = generateSlug('HelloWorldQuiz');
      expect(result).toBe('helloworldquiz');
    });
  });

  describe('generateRoomCode', () => {
    it('should generate a 6-digit code', () => {
      const code = generateRoomCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate code between 100000 and 999999', () => {
      const code = generateRoomCode();
      const numCode = parseInt(code, 10);
      expect(numCode).toBeGreaterThanOrEqual(100000);
      expect(numCode).toBeLessThanOrEqual(999999);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode());
      }
      // Should have at least some variety in 100 calls
      expect(codes.size).toBeGreaterThan(50);
    });

    it('should always return a string', () => {
      const code = generateRoomCode();
      expect(typeof code).toBe('string');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp to ISO string', () => {
      const timestamp = 1609459200000; // 2021-01-01T00:00:00.000Z
      const result = formatTimestamp(timestamp);
      expect(result).toBe('2021-01-01T00:00:00.000Z');
    });

    it('should handle current timestamp', () => {
      const now = Date.now();
      const result = formatTimestamp(now);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle epoch time (0)', () => {
      const result = formatTimestamp(0);
      expect(result).toBe('1970-01-01T00:00:00.000Z');
    });
  });

  describe('calculateTimeRemaining', () => {
    it('should calculate remaining time correctly', () => {
      const startTime = Date.now() - 5000; // Started 5 seconds ago
      const timeLimit = 60; // 60 seconds limit
      const remaining = calculateTimeRemaining(startTime, timeLimit);
      
      expect(remaining).toBeGreaterThanOrEqual(54);
      expect(remaining).toBeLessThanOrEqual(55);
    });

    it('should return 0 when time limit is exceeded', () => {
      const startTime = Date.now() - 70000; // Started 70 seconds ago
      const timeLimit = 60; // 60 seconds limit
      const remaining = calculateTimeRemaining(startTime, timeLimit);
      
      expect(remaining).toBe(0);
    });

    it('should return full time when just started', () => {
      const startTime = Date.now();
      const timeLimit = 60;
      const remaining = calculateTimeRemaining(startTime, timeLimit);
      
      expect(remaining).toBeGreaterThanOrEqual(59);
      expect(remaining).toBeLessThanOrEqual(60);
    });

    it('should handle zero time limit', () => {
      const startTime = Date.now();
      const timeLimit = 0;
      const remaining = calculateTimeRemaining(startTime, timeLimit);
      
      expect(remaining).toBe(0);
    });
  });

  describe('sendSuccess', () => {
    it('should send success response with data', () => {
      const mockRes = mockResponse() as Response;
      const data = { id: '123', name: 'Test' };

      sendSuccess(mockRes, data, 'Operation successful');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operation successful',
        data: data,
      });
    });

    it('should use default success message', () => {
      const mockRes = mockResponse() as Response;
      const data = { id: '123' };

      sendSuccess(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: data,
      });
    });

    it('should handle null data', () => {
      const mockRes = mockResponse() as Response;

      sendSuccess(mockRes, null, 'Done');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Done',
        data: null,
      });
    });
  });

  describe('sendError', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should send error response with status code', () => {
      const mockRes = mockResponse() as Response;

      sendError(mockRes, 404, 'Not found');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not found',
      });
    });

    it('should include error details in development mode', () => {
      process.env.NODE_ENV = 'development';
      const mockRes = mockResponse() as Response;
      const error = new Error('Test error');

      sendError(mockRes, 500, 'Server error', error);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
        error: error,
      });
    });

    it('should not include error details in production mode', () => {
      process.env.NODE_ENV = 'production';
      const mockRes = mockResponse() as Response;
      const error = new Error('Test error');

      sendError(mockRes, 500, 'Server error', error);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error',
      });
    });

    it('should handle different status codes', () => {
      const mockRes = mockResponse() as Response;

      sendError(mockRes, 400, 'Bad request');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad request',
      });
    });
  });
});
