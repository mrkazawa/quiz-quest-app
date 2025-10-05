import session from 'express-session';
import crypto from 'crypto';

// Generate a secure session secret if not provided
const generateSessionSecret = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

// Detect if running behind a secure proxy (Nginx, localhost.run, serveo)
// These proxies handle HTTPS and forward HTTP to the app
const isBehindSecureProxy = process.env.BEHIND_PROXY === 'true' || 
                           process.env.LOCALHOST_RUN_ENABLED === 'true' ||
                           process.env.SERVEO_ENABLED === 'true';

const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || generateSessionSecret(),
  resave: false,
  saveUninitialized: false, // Changed to false for better security
  cookie: {
    // Only set secure=true if using HTTPS directly, not behind a proxy
    secure: process.env.NODE_ENV === 'production' && !isBehindSecureProxy,
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    // Use 'lax' for better compatibility, especially with proxies and tunneling
    sameSite: 'lax', // CSRF protection while allowing cross-site navigation
  },
  name: 'quiz.sid', // Custom session name for security
};

// Warn if using default secret in production
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: Using generated session secret. Set SESSION_SECRET environment variable for production!');
  console.warn('⚠️  Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

const middleware = session(sessionConfig);

export default {
  config: sessionConfig,
  middleware
};
