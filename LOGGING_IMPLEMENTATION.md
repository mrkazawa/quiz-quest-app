# Logging Implementation Guide

## Overview

The Quiz Quest application now uses a comprehensive logging system with configurable verbosity levels. This replaces all previous `console.log`, `console.error`, and `console.warn` statements with a production-ready logger.

## Logger Features

### Log Levels

The logger supports 6 hierarchical log levels (from highest to lowest priority):

1. **ERROR** (0) - Critical errors that require immediate attention
2. **WARN** (1) - Warning messages for potentially problematic situations
3. **INFO** (2) - General informational messages about application flow
4. **HTTP** (3) - HTTP request/response logging
5. **DEBUG** (4) - Detailed debugging information
6. **VERBOSE** (5) - Very detailed logging for troubleshooting

### Configuration

The logger is controlled via the `LOG_LEVEL` environment variable:

```bash
# Show only errors
LOG_LEVEL=error npm start

# Show errors and warnings (production default)
LOG_LEVEL=info npm start

# Show everything except verbose (development default)
LOG_LEVEL=debug npm start

# Show absolutely everything (troubleshooting)
LOG_LEVEL=verbose npm start
```

### Auto-Detection

If `LOG_LEVEL` is not set, the logger auto-detects based on `NODE_ENV`:

- **Development**: `LOG_LEVEL=debug` (shows error, warn, info, http, debug)
- **Production**: `LOG_LEVEL=info` (shows error, warn, info)
- **Test**: `LOG_LEVEL=error` (shows only errors)

## Usage Examples

### Basic Logging

```typescript
import logger from './utils/logger';

// Critical errors
logger.error('Database connection failed', error);

// Warnings
logger.warn('Rate limit approaching threshold');

// General information
logger.info('User logged in successfully');

// HTTP requests (usually handled by middleware)
logger.http('GET /api/quiz 200 45ms');

// Debugging details
logger.debug('Processing quiz submission', { quizId, answers });

// Verbose troubleshooting
logger.verbose('Full request payload:', requestData);
```

### Utility Methods

```typescript
// Success messages (uses INFO level)
logger.success('Quiz created successfully');
// Output: ✅ Quiz created successfully

// Failure messages (uses ERROR level)
logger.fail('Failed to create quiz');
// Output: ❌ Failed to create quiz

// HTTP request logging
logger.request('GET', '/api/quiz/123', 200, 45);
// Output: GET /api/quiz/123 [200]
```

## Migration from console.log

All `console.log`, `console.error`, and `console.warn` statements have been replaced:

### Before
```typescript
console.log('Student joined room', roomId);
console.error('Error creating room:', error);
console.warn('Room not found');
```

### After
```typescript
logger.info('Student joined room', roomId);
logger.error('Error creating room:', error);
logger.warn('Room not found');
```

## Updated Files

The following files have been updated to use the logger:

### Controllers
- `api/src/controllers/AuthController.ts`
- `api/src/controllers/QuizController.ts`
- `api/src/controllers/HistoryController.ts`
- `api/src/controllers/RoomController.ts`

### Services
- `api/src/services/QuizService.ts`
- `api/src/services/HistoryService.ts`
- `api/src/services/RoomService.ts`

### Socket Handlers
- `api/src/socket/socketConfig.ts`
- `api/src/socket/handlers/roomHandlers.ts`
- `api/src/socket/handlers/gameHandlers.ts`
- `api/src/socket/handlers/teacherHandlers.ts`

### Middleware & Utilities
- `api/src/middleware/logging.ts`
- `api/src/middleware/validation.ts`
- `api/src/utils/errorMonitor.ts`
- `api/src/server.ts`

## Recommended Settings

### Development (Local Testing)
```bash
LOG_LEVEL=debug npm run dev
```
Shows detailed information without overwhelming verbosity.

### Classroom Use (Production-like)
```bash
LOG_LEVEL=info npm start
```
Shows important events without debug details.

### Troubleshooting Issues
```bash
LOG_LEVEL=verbose npm start
```
Shows everything including detailed data structures.

### Production Deployment
```bash
NODE_ENV=production LOG_LEVEL=info npm start
```
Shows only errors, warnings, and important information.

## Color Coding

The logger uses ANSI color codes for better readability:

- 🔴 **ERROR**: Red text
- 🟡 **WARN**: Yellow text
- 🔵 **INFO**: Cyan text
- 🟢 **HTTP**: Green text
- ⚪ **DEBUG**: White text
- ⚫ **VERBOSE**: Gray text

## Testing the Logger

A test script is available to verify log levels:

```bash
cd api

# Test error level (shows only errors)
LOG_LEVEL=error node test-logger-levels.js

# Test info level (production default)
LOG_LEVEL=info node test-logger-levels.js

# Test debug level (development default)
LOG_LEVEL=debug node test-logger-levels.js

# Test verbose level (shows everything)
LOG_LEVEL=verbose node test-logger-levels.js
```

## Benefits

1. **Production-Ready**: Configurable logging levels for different environments
2. **Better Debugging**: Color-coded, timestamped output
3. **Performance**: Can reduce log noise in production
4. **Maintainability**: Consistent logging pattern across the codebase
5. **Flexibility**: Environment variable control (no code changes needed)

## Best Practices

1. Use `logger.error()` for exceptions and critical failures
2. Use `logger.warn()` for recoverable issues or deprecations
3. Use `logger.info()` for user actions and important events
4. Use `logger.http()` for HTTP request/response logging
5. Use `logger.debug()` for development debugging
6. Use `logger.verbose()` for detailed troubleshooting data

## Future Enhancements

Potential improvements for the logging system:

- [ ] Log file rotation (save logs to files)
- [ ] External log aggregation (send to services like Loggly, Datadog)
- [ ] Structured JSON logging for production
- [ ] Request ID tracking across services
- [ ] Performance metrics logging
