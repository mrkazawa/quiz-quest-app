let morgan;

try {
  morgan = require('morgan');
} catch (error) {
  console.warn('⚠️ morgan not available, using console logging');
  morgan = () => (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  };
  morgan.token = () => {};
}

// Custom logging format
const logFormat = process.env.NODE_ENV === 'production' 
  ? 'combined' 
  : ':method :url :status :res[content-length] - :response-time ms';

// Custom tokens for better logging
morgan.token('real-ip', (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip;
});

// Skip logging for health checks and static files
const skipLog = (req, res) => {
  return req.url === '/health' || 
         req.url.startsWith('/static/') ||
         res.statusCode < 400; // Only log errors in production
};

const requestLogger = morgan(logFormat, {
  skip: process.env.NODE_ENV === 'production' ? skipLog : false,
  stream: {
    write: (message) => {
      // Use console.log for development, could integrate with proper logging service
      console.log(message.trim());
    }
  }
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove powered-by header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// Health check endpoint
const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
};

module.exports = {
  requestLogger,
  securityHeaders,
  healthCheck,
};
