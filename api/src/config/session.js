const session = require("express-session");
const crypto = require("crypto");

// Generate a secure session secret if not provided
const generateSessionSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

const sessionConfig = {
  secret: process.env.SESSION_SECRET || generateSessionSecret(),
  resave: false,
  saveUninitialized: false, // Changed to false for better security
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // CSRF protection
  },
  name: 'quiz.sid', // Custom session name for security
};

// Warn if using default secret in production
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: Using generated session secret. Set SESSION_SECRET environment variable for production!');
}

const middleware = session(sessionConfig);

module.exports = {
  config: sessionConfig,
  middleware
};
