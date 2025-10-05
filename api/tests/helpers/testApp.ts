import express, { Express } from 'express';
import cors from 'cors';
import * as sessionConfigModule from '../../src/config/session';
import * as corsConfigModule from '../../src/config/cors';

const sessionConfig = sessionConfigModule.default;
const corsConfig = corsConfigModule.default;

// Import routes
import * as authRoutesModule from '../../src/routes/auth';
import * as quizRoutesModule from '../../src/routes/quiz';
import * as historyRoutesModule from '../../src/routes/history';
import * as roomRoutesModule from '../../src/routes/room';

const authRoutes = authRoutesModule.default;
const quizRoutes = quizRoutesModule.default;
const historyRoutes = historyRoutesModule.default;
const roomRoutes = roomRoutesModule.default;

/**
 * Create a test app instance without Socket.IO
 * This allows tests to run without hanging on open socket connections
 */
export function createTestApp(): Express {
  const app = express();

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS middleware
  app.use(cors(corsConfig));

  // Session middleware
  app.use(sessionConfig.middleware);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes
  app.use('/api', authRoutes);
  app.use('/api', quizRoutes);
  app.use('/api', historyRoutes);
  app.use('/api', roomRoutes);

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  return app;
}
