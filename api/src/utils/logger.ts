/**
 * Logger Utility - Production-Level Logging
 * 
 * Usage:
 *   import logger from './utils/logger';
 *   logger.info('Server started');
 *   logger.debug('Detailed debug info', { data });
 *   logger.error('Error occurred', error);
 * 
 * Log Levels (in order of severity):
 *   - error: Critical errors that need immediate attention
 *   - warn: Warning messages for potentially harmful situations
 *   - info: General informational messages (default)
 *   - http: HTTP request/response logging
 *   - debug: Detailed debugging information
 *   - verbose: Very detailed information (everything)
 * 
 * Configuration via Environment Variables:
 *   LOG_LEVEL=debug npm start      # Show debug and above
 *   LOG_LEVEL=error npm start      # Show only errors
 *   LOG_LEVEL=verbose npm start    # Show everything
 *   NODE_ENV=production npm start  # Auto-sets to 'info' if not specified
 * 
 * Default Behavior:
 *   - Development: LOG_LEVEL=debug (shows most logs)
 *   - Production: LOG_LEVEL=info (shows info, warn, error)
 *   - Test: LOG_LEVEL=error (shows only errors)
 */

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  DEBUG = 4,
  VERBOSE = 5
}

interface LoggerConfig {
  level: LogLevel;
  useColors: boolean;
  useEmojis: boolean;
  includeTimestamp: boolean;
}

class Logger {
  private config: LoggerConfig;
  private readonly levelNames: Record<LogLevel, string> = {
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.HTTP]: 'HTTP',
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.VERBOSE]: 'VERBOSE'
  };

  private readonly colors: Record<LogLevel, string> = {
    [LogLevel.ERROR]: '\x1b[31m',    // Red
    [LogLevel.WARN]: '\x1b[33m',     // Yellow
    [LogLevel.INFO]: '\x1b[36m',     // Cyan
    [LogLevel.HTTP]: '\x1b[35m',     // Magenta
    [LogLevel.DEBUG]: '\x1b[32m',    // Green
    [LogLevel.VERBOSE]: '\x1b[37m'   // White
  };

  private readonly reset = '\x1b[0m';

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): LoggerConfig {
    // Determine log level from environment
    const envLevel = (process.env.LOG_LEVEL || '').toLowerCase();
    let level: LogLevel;

    switch (envLevel) {
      case 'error':
        level = LogLevel.ERROR;
        break;
      case 'warn':
        level = LogLevel.WARN;
        break;
      case 'info':
        level = LogLevel.INFO;
        break;
      case 'http':
        level = LogLevel.HTTP;
        break;
      case 'debug':
        level = LogLevel.DEBUG;
        break;
      case 'verbose':
        level = LogLevel.VERBOSE;
        break;
      default:
        // Default based on NODE_ENV
        if (process.env.NODE_ENV === 'production') {
          level = LogLevel.INFO;
        } else if (process.env.NODE_ENV === 'test') {
          level = LogLevel.ERROR;
        } else {
          level = LogLevel.DEBUG; // Development default
        }
    }

    return {
      level,
      useColors: process.stdout.isTTY !== false, // Auto-detect terminal support
      useEmojis: true,
      includeTimestamp: true
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const parts: string[] = [];

    // Timestamp
    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    // Level
    const levelName = this.levelNames[level];
    if (this.config.useColors) {
      parts.push(`${this.colors[level]}${levelName}${this.reset}`);
    } else {
      parts.push(levelName);
    }

    // Message
    parts.push(message);

    // Additional arguments
    if (args.length > 0) {
      const formatted = args.map(arg => {
        if (arg instanceof Error) {
          return `\n${arg.stack || arg.message}`;
        } else if (typeof arg === 'object') {
          return `\n${JSON.stringify(arg, null, 2)}`;
        }
        return String(arg);
      }).join(' ');
      parts.push(formatted);
    }

    return parts.join(' ');
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formatted = this.formatMessage(level, message, ...args);

    if (level === LogLevel.ERROR) {
      console.error(formatted);
    } else if (level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  // Public API
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  http(message: string, ...args: any[]): void {
    this.log(LogLevel.HTTP, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  verbose(message: string, ...args: any[]): void {
    this.log(LogLevel.VERBOSE, message, ...args);
  }

  // Utility methods for common patterns
  success(message: string, ...args: any[]): void {
    this.info(`✅ ${message}`, ...args);
  }

  fail(message: string, ...args: any[]): void {
    this.error(`❌ ${message}`, ...args);
  }

  request(method: string, path: string, statusCode?: number): void {
    const status = statusCode ? `[${statusCode}]` : '';
    this.http(`${method} ${path} ${status}`);
  }

  // Get current log level (useful for debugging)
  getLevel(): string {
    return this.levelNames[this.config.level];
  }

  // Set log level programmatically
  setLevel(level: 'error' | 'warn' | 'info' | 'http' | 'debug' | 'verbose'): void {
    const levelMap: Record<string, LogLevel> = {
      error: LogLevel.ERROR,
      warn: LogLevel.WARN,
      info: LogLevel.INFO,
      http: LogLevel.HTTP,
      debug: LogLevel.DEBUG,
      verbose: LogLevel.VERBOSE
    };
    this.config.level = levelMap[level];
  }
}

// Export singleton instance
export default new Logger();
