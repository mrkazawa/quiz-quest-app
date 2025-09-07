// Validation utilities
const validateQuizData = (quizData) => {
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
const generateSlug = (text) => {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
};

const generateRoomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Time utilities
const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toISOString();
};

const calculateTimeRemaining = (startTime, timeLimit) => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  return Math.max(0, timeLimit - elapsed);
};

// Response utilities
const sendSuccess = (res, data, message = 'Success') => {
  res.json({
    success: true,
    message,
    data
  });
};

const sendError = (res, statusCode, message, error = null) => {
  const response = {
    success: false,
    message
  };

  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  validateQuizData,
  generateSlug,
  generateRoomCode,
  formatTimestamp,
  calculateTimeRemaining,
  sendSuccess,
  sendError
};
