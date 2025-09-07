import { Request, Response, NextFunction } from 'express';

let rateLimit: any;

try {
  rateLimit = require('express-rate-limit');
} catch (error) {
  console.warn('⚠️ express-rate-limit not available, using no-op middleware');
  rateLimit = () => (req: Request, res: Response, next: NextFunction) => next();
}

// Rate limiting configuration
const createRateLimit = (windowMs: number, max: number, message: string) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

// Different rate limits for different endpoints
export const rateLimits = {
  // General API rate limit
  general: createRateLimit(15 * 60 * 1000, 100, 'Too many requests, please try again later'),
  
  // Stricter limits for auth endpoints
  auth: createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'),
  
  // Room creation limit
  roomCreation: createRateLimit(5 * 60 * 1000, 3, 'Too many room creation attempts'),
  
  // Quiz creation limit
  quizCreation: createRateLimit(10 * 60 * 1000, 5, 'Too many quiz creation attempts'),
};

// Input validation helpers
export const validateString = (value: any, fieldName: string, minLength: number = 1, maxLength: number = 255): string => {
  if (!value || typeof value !== 'string') {
    throw new Error(`${fieldName} is required and must be a string`);
  }
  if (value.trim().length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters long`);
  }
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must not exceed ${maxLength} characters`);
  }
  return value.trim();
};

export const validateNumber = (value: any, fieldName: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return num;
};

export const validateRoomCode = (roomCode: any): string => {
  if (!/^\d{6}$/.test(roomCode)) {
    throw new Error('Room code must be exactly 6 digits');
  }
  return roomCode;
};

export default {
  rateLimits,
  validateString,
  validateNumber,
  validateRoomCode,
};
