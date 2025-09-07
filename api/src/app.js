const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import configuration and middleware
const sessionConfig = require("./config/session");
const corsConfig = require("./config/cors");
const socketConfig = require("./socket/socketConfig");

// Try to load optional middleware
let compression, requestLogger, securityHeaders, healthCheck, rateLimits;

try {
  compression = require("compression");
} catch (e) {
  compression = (req, res, next) => next();
}

try {
  const logging = require("./middleware/logging");
  requestLogger = logging.requestLogger;
  securityHeaders = logging.securityHeaders;
  healthCheck = logging.healthCheck;
} catch (e) {
  console.warn('⚠️ Logging middleware not available');
  requestLogger = (req, res, next) => next();
  securityHeaders = (req, res, next) => next();
  healthCheck = (req, res) => res.json({ status: 'ok' });
}

try {
  const validation = require("./middleware/validation");
  rateLimits = validation.rateLimits;
} catch (e) {
  console.warn('⚠️ Validation middleware not available');
  rateLimits = {
    general: (req, res, next) => next(),
    auth: (req, res, next) => next(),
    quizCreation: (req, res, next) => next(),
    roomCreation: (req, res, next) => next(),
  };
}

// Import routes
const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz");
const historyRoutes = require("./routes/history");
const roomRoutes = require("./routes/room");

// Import services to initialize them
const QuizService = require("./services/QuizService");

class App {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocket();
    this.setupStaticFiles();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security headers
    this.app.use(securityHeaders);
    
    // Request logging
    this.app.use(requestLogger);
    
    // Compression
    this.app.use(compression());
    
    // Trust proxy if behind reverse proxy
    if (process.env.NODE_ENV === 'production') {
      this.app.set('trust proxy', 1);
    }
    
    // General rate limiting
    this.app.use(rateLimits.general);
    
    // Body parsing middleware with size limits
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // CORS middleware
    this.app.use(cors(corsConfig));
    
    // Session middleware
    this.app.use(sessionConfig.middleware);
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', healthCheck);
    
    // API routes - mount all routes under /api
    this.app.use("/api", authRoutes);
    this.app.use("/api", quizRoutes);
    this.app.use("/api", historyRoutes);
    this.app.use("/api", roomRoutes);
  }

  setupSocket() {
    // Initialize Socket.IO with configuration
    this.io = socketConfig.initialize(this.server, sessionConfig.middleware);
  }

  setupStaticFiles() {
    // Serve static files from the React build directory
    this.app.use(express.static(path.join(__dirname, "../../client/dist")));

    // Serve React app for all non-API routes
    this.app.get("*", (req, res) => {
      // Don't interfere with API routes or socket.io
      if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      // For all other routes, serve the React app
      res.sendFile(path.join(__dirname, "../../client/dist", "index.html"));
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Global error handler:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    // 404 handler for API routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });
  }

  getServer() {
    return this.server;
  }

  getApp() {
    return this.app;
  }

  getIO() {
    return this.io;
  }
}

module.exports = App;
