import { Response } from 'express';

// Validation utilities
export const validateQuizData = (quizData: any): boolean => {
  if (!quizData.setName || typeof quizData.setName !== 'string') {
    throw new Error("Missing or invalid 'setName' field");
  }

  if (!quizData.setDescription || typeof quizData.setDescription !== 'string') {
    throw new Error("Missing or invalid 'setDescription' field");
  }

  if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    throw new Error("Missing or empty 'questions' array");
  }

  return true;
};

// String utilities
export const generateSlug = (text: string): string => {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
};

export const generateRoomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Time utilities
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};

export const calculateTimeRemaining = (startTime: number, timeLimit: number): number => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  return Math.max(0, timeLimit - elapsed);
};

// Response utilities
export const sendSuccess = (res: Response, data: any, message: string = 'Success'): void => {
  res.json({
    success: true,
    message,
    data
  });
};

export const sendError = (res: Response, statusCode: number, message: string, error: any = null): void => {
  const response: any = {
    success: false,
    message
  };

  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error;
  }

  res.status(statusCode).json(response);
};

export default {
  validateQuizData,
  generateSlug,
  generateRoomCode,
  formatTimestamp,
  calculateTimeRemaining,
  sendSuccess,
  sendError
};
