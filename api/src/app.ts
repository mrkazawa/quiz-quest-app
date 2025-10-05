import express, { Express, Request, Response, NextFunction } from 'express';
import http, { Server as HttpServer } from 'http';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configuration and middleware
import * as sessionConfigModule from './config/session';
import * as corsConfigModule from './config/cors';
import * as socketConfigModule from './socket/socketConfig';

const sessionConfig = sessionConfigModule.default;
const corsConfig = corsConfigModule.default;
const socketConfig = socketConfigModule.default;
import { TypedServer } from './types/socket';

// Try to load optional middleware
let compression: any, requestLogger: any, securityHeaders: any, healthCheck: any;

try {
  compression = require('compression');
} catch (e) {
  compression = (req: Request, res: Response, next: NextFunction) => next();
}

try {
  const logging = require('./middleware/logging');
  requestLogger = logging.requestLogger;
  securityHeaders = logging.securityHeaders;
  healthCheck = logging.healthCheck;
} catch (e) {
  console.warn('⚠️ Logging middleware not available');
  requestLogger = (req: Request, res: Response, next: NextFunction) => next();
  securityHeaders = (req: Request, res: Response, next: NextFunction) => next();
  healthCheck = (req: Request, res: Response) => res.json({ status: 'ok' });
}

// Import routes
import * as authRoutesModule from './routes/auth';
import * as quizRoutesModule from './routes/quiz';
import * as historyRoutesModule from './routes/history';
import * as roomRoutesModule from './routes/room';

const authRoutes = authRoutesModule.default;
const quizRoutes = quizRoutesModule.default;
const historyRoutes = historyRoutesModule.default;
const roomRoutes = roomRoutesModule.default;

// Import services to initialize them
import './services/QuizService';

class App {
  private app: Express;
  private server: HttpServer;
  private io?: TypedServer;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocket();
    this.setupStaticFiles();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
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
    
    // Body parsing middleware with size limits
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // CORS middleware
    this.app.use(cors(corsConfig));
    
    // Session middleware
    this.app.use(sessionConfig.middleware);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', healthCheck);
    
    // API routes - mount all routes under /api
    this.app.use('/api', authRoutes);
    this.app.use('/api', quizRoutes);
    this.app.use('/api', historyRoutes);
    this.app.use('/api', roomRoutes);
  }

  private setupSocket(): void {
    // Initialize Socket.IO with configuration
    this.io = socketConfig.initialize(this.server, sessionConfig.middleware);
  }

  private setupStaticFiles(): void {
    // Serve static files from the React build directory
    this.app.use(express.static(path.join(__dirname, '../../client/dist')));

    // Serve React app for all non-API routes
    this.app.get('*', (req: Request, res: Response): void => {
      // Don't interfere with API routes or socket.io
      if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
        res.status(404).json({ error: 'API endpoint not found' });
        return;
      }
      
      // For all other routes, serve the React app
      res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'));
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Global error handler:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    // 404 handler for API routes
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });
  }

  public getServer(): HttpServer {
    return this.server;
  }

  public getApp(): Express {
    return this.app;
  }

  public getIO(): TypedServer | undefined {
    return this.io;
  }
}

export default App;
