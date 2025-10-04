// Error tracking and monitoring utilities
import logger from './logger';

interface ErrorLogEntry {
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: Record<string, any>;
  count: number;
  uptime: number;
}

interface ErrorStats {
  totalErrors: number;
  uniqueErrors: number;
  topErrors: Array<{ error: string; count: number }>;
  uptime: number;
}

class ErrorMonitor {
  private errorCounts = new Map<string, number>();
  private startTime = Date.now();

  logError(error: Error, context: Record<string, any> = {}): ErrorLogEntry {
    const errorKey = `${error.name}:${error.message}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      count: count + 1,
      uptime: Date.now() - this.startTime,
    };

    logger.error('Error logged:', logEntry);

    // In production, you could send this to an external monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: send to monitoring service
      // await sendToMonitoringService(logEntry);
    }

    return logEntry;
  }

  getErrorStats(): ErrorStats {
    return {
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      uniqueErrors: this.errorCounts.size,
      topErrors: Array.from(this.errorCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([error, count]) => ({ error, count })),
      uptime: Date.now() - this.startTime,
    };
  }

  resetStats(): void {
    this.errorCounts.clear();
    this.startTime = Date.now();
  }
}

// Singleton instance
export const errorMonitor = new ErrorMonitor();

// Async error wrapper for better error handling
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      errorMonitor.logError(error, {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
      next(error);
    });
  };
};

// Socket error wrapper
export const socketErrorHandler = (fn: Function) => {
  return (...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      errorMonitor.logError(error as Error, {
        event: 'socket_error',
        socketId: args[0]?.id,
      });
      throw error;
    }
  };
};

export default {
  errorMonitor,
  asyncHandler,
  socketErrorHandler,
};
