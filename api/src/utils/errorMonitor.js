// Error tracking and monitoring utilities

class ErrorMonitor {
  constructor() {
    this.errorCounts = new Map();
    this.startTime = Date.now();
  }

  logError(error, context = {}) {
    const errorKey = `${error.name}:${error.message}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    const logEntry = {
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

    console.error('❌ Error logged:', JSON.stringify(logEntry, null, 2));

    // In production, you could send this to an external monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: send to monitoring service
      // await sendToMonitoringService(logEntry);
    }

    return logEntry;
  }

  getErrorStats() {
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

  resetStats() {
    this.errorCounts.clear();
    this.startTime = Date.now();
  }
}

// Singleton instance
const errorMonitor = new ErrorMonitor();

// Async error wrapper for better error handling
const asyncHandler = (fn) => {
  return (req, res, next) => {
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
const socketErrorHandler = (fn) => {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      errorMonitor.logError(error, {
        event: 'socket_error',
        socketId: args[0]?.id,
      });
      throw error;
    }
  };
};

module.exports = {
  errorMonitor,
  asyncHandler,
  socketErrorHandler,
};
