let rateLimit;

try {
  rateLimit = require('express-rate-limit');
} catch (error) {
  console.warn('⚠️ express-rate-limit not available, using no-op middleware');
  rateLimit = () => (req, res, next) => next();
}

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

// Different rate limits for different endpoints
const rateLimits = {
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
const validateString = (value, fieldName, minLength = 1, maxLength = 255) => {
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

const validateNumber = (value, fieldName, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return num;
};

const validateRoomCode = (roomCode) => {
  if (!/^\d{6}$/.test(roomCode)) {
    throw new Error('Room code must be exactly 6 digits');
  }
  return roomCode;
};

module.exports = {
  rateLimits,
  validateString,
  validateNumber,
  validateRoomCode,
};
