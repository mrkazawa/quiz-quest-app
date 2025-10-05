# Utilities

Utility functions and helpers used throughout the API. These are low-level, reusable functions that don't fit into services, controllers, or middleware.

---

## 📁 File Structure

```
utils/
├── logger.ts          # Logging utility with multiple levels
├── helpers.ts         # General helper functions
└── errorMonitor.ts    # Error monitoring (if needed)
```

---

## 📝 logger.ts - Logging Utility

Comprehensive logging system with multiple log levels, formatting, and environment awareness.

### Features

- ✅ **6 Log Levels**: error, warn, info, http, debug, verbose
- ✅ **Colored Output**: Different colors for different levels
- ✅ **Timestamps**: ISO 8601 format timestamps
- ✅ **Environment-Aware**: Auto-detects NODE_ENV
- ✅ **Configurable**: Set log level via LOG_LEVEL env variable
- ✅ **Formatted Output**: Pretty-prints objects, errors
- ✅ **Utility Methods**: success(), fail(), request()

### Usage

```typescript
import logger from '../utils/logger';

// Basic logging
logger.error('Critical error occurred');
logger.warn('This is a warning');
logger.info('General information');
logger.http('HTTP request received');
logger.debug('Debug information');
logger.verbose('Detailed logging');

// With additional context
logger.error('Database error', error);
logger.info('User action', { userId: '123', action: 'login' });

// Utility methods
logger.success('Operation completed successfully');
logger.fail('Operation failed');
logger.request('GET', '/api/quiz', 200, 45); // method, path, status, duration
```

### Log Levels (in order)

```typescript
error    // 0 - Critical errors (always shown)
warn     // 1 - Warnings
info     // 2 - General information (default)
http     // 3 - HTTP requests
debug    // 4 - Debug information
verbose  // 5 - Detailed logging
```

**Filtering**: Setting a log level shows that level and all higher priority levels.

Example:
```bash
# Show only errors and warnings
export LOG_LEVEL=warn

# Show errors, warnings, and info (default)
export LOG_LEVEL=info

# Show everything
export LOG_LEVEL=verbose
```

### Configuration

**Environment Variables:**

```bash
# Set log level (default: info)
export LOG_LEVEL=debug

# Auto-detected environment
export NODE_ENV=production  # Quieter logging
export NODE_ENV=development # More verbose logging
```

**Default Behavior:**
- **Production** (`NODE_ENV=production`): Defaults to `info` level
- **Development** (`NODE_ENV=development`): Defaults to `debug` level
- **Test** (`NODE_ENV=test`): Defaults to `error` level (quiet)

### API Methods

#### Basic Logging

```typescript
logger.error(message: string, ...args: any[]): void
logger.warn(message: string, ...args: any[]): void
logger.info(message: string, ...args: any[]): void
logger.http(message: string, ...args: any[]): void
logger.debug(message: string, ...args: any[]): void
logger.verbose(message: string, ...args: any[]): void
```

#### Utility Methods

```typescript
// Success message (with ✅ emoji)
logger.success(message: string, ...args: any[]): void

// Failure message (with ❌ emoji)
logger.fail(message: string, ...args: any[]): void

// HTTP request logging
logger.request(
  method: string,      // GET, POST, etc.
  path: string,        // /api/quiz
  status?: number,     // 200, 404, etc.
  duration?: number    // milliseconds
): void
```

#### Configuration Methods

```typescript
// Get current log level
logger.getLevel(): string

// Set log level programmatically
logger.setLevel(level: 'error' | 'warn' | 'info' | 'http' | 'debug' | 'verbose'): void
```

### Examples

#### Error Logging

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error);
  // Output: [2025-10-05T10:30:00.000Z] ERROR: Operation failed
  //         Error: Something went wrong
  //           at riskyOperation (...)
}
```

#### Request Logging

```typescript
// In middleware or controller
logger.request('GET', '/api/quiz', 200, 45);
// Output: [2025-10-05T10:30:00.000Z] HTTP: GET /api/quiz [200] 45ms

logger.request('POST', '/api/quiz', 404);
// Output: [2025-10-05T10:30:00.000Z] HTTP: POST /api/quiz [404]
```

#### Success/Fail Messages

```typescript
if (quizCreated) {
  logger.success('Quiz created successfully');
  // Output: [2025-10-05T10:30:00.000Z] INFO: ✅ Quiz created successfully
} else {
  logger.fail('Failed to create quiz');
  // Output: [2025-10-05T10:30:00.000Z] ERROR: ❌ Failed to create quiz
}
```

#### Context Logging

```typescript
logger.info('User joined room', {
  userId: 'student-123',
  roomId: '456789',
  timestamp: Date.now()
});
// Output: [2025-10-05T10:30:00.000Z] INFO: User joined room
//         {
//           "userId": "student-123",
//           "roomId": "456789",
//           "timestamp": 1696502400000
//         }
```

### Output Format

```
[TIMESTAMP] LEVEL: MESSAGE [additional args formatted]

Examples:
[2025-10-05T10:30:00.000Z] ERROR: Database connection failed
[2025-10-05T10:30:15.000Z] INFO: Server started on port 3000
[2025-10-05T10:30:20.000Z] HTTP: GET /api/quiz [200] 45ms
[2025-10-05T10:30:25.000Z] DEBUG: Socket connected: abc123
```

### When to Use Each Level

| Level | When to Use | Examples |
|-------|-------------|----------|
| **error** | Critical errors, failures | Database errors, unhandled exceptions, system failures |
| **warn** | Warnings, potential issues | Deprecated features, missing optional config, slow operations |
| **info** | General information | Server started, user actions, successful operations |
| **http** | HTTP requests/responses | Request received, response sent, API calls |
| **debug** | Debug information | Variable values, function calls, state changes |
| **verbose** | Detailed logging | Detailed flow, full objects, trace information |

### Testing

The logger is fully tested with 100% coverage.

**Test file:** `api/tests/unit/utils/logger.test.ts`

**Run tests:**
```bash
npm test -- logger.test.ts
```

**Test coverage:**
```bash
npm run test:coverage -- logger.test.ts
```

---

## 🛠️ helpers.ts - Helper Functions

General utility functions used across the application.

### Available Helpers

#### Validation

```typescript
// Validate quiz data structure
validateQuizData(quizData: any): boolean

// Throws error if invalid
```

#### String Utilities

```typescript
// Convert text to URL-friendly slug
generateSlug(text: string): string
// Example: "Hello World!" → "hello-world"

// Generate 6-digit room code
generateRoomCode(): string
// Example: "123456"
```

#### Time Utilities

```typescript
// Format timestamp to ISO string
formatTimestamp(timestamp: number): string
// Example: 1696502400000 → "2025-10-05T10:30:00.000Z"

// Calculate remaining time
calculateTimeRemaining(startTime: number, duration: number): number
```

#### Response Helpers

```typescript
// Send success response
sendSuccess(res: Response, data?: any): void

// Send error response
sendError(res: Response, message: string, status?: number): void
```

### Usage Examples

```typescript
import { 
  generateSlug, 
  generateRoomCode,
  validateQuizData 
} from '../utils/helpers';

// Generate room code
const roomCode = generateRoomCode();
console.log(roomCode); // "847392"

// Validate quiz
try {
  validateQuizData(quizData);
  console.log('Quiz is valid');
} catch (error) {
  console.error('Invalid quiz:', error.message);
}

// Generate slug
const slug = generateSlug('My Awesome Quiz!');
console.log(slug); // "my-awesome-quiz"
```

---

## 🚨 errorMonitor.ts - Error Monitoring

(If implemented) Centralized error monitoring and reporting.

### Purpose

- Monitor uncaught exceptions
- Track error patterns
- Report critical errors
- Provide error analytics

---

## ✅ Best Practices

### Logging Best Practices

```typescript
// ✅ DO: Use appropriate log levels
logger.error('Critical error');  // Only for real errors
logger.info('User logged in');   // General info
logger.debug('Processing data'); // Debug info

// ✅ DO: Include context
logger.error('Database query failed', { 
  query: 'SELECT * FROM users',
  error: error.message 
});

// ✅ DO: Log at entry points
logger.info('Server starting on port', port);
logger.http('Request received', { method, path });

// ❌ DON'T: Over-log
logger.debug('About to call function'); // Too verbose
logger.debug('Function called');        // Too verbose
logger.debug('Function returned');      // Too verbose

// ❌ DON'T: Log sensitive data
logger.info('User password:', password); // ❌ Security risk!

// ✅ DO: Sanitize sensitive data
logger.info('User login', { username, passwordLength: password.length });
```

### Helper Function Best Practices

```typescript
// ✅ DO: Make functions pure (no side effects)
const generateSlug = (text: string): string => {
  return text.toLowerCase().replace(/\s+/g, '-');
};

// ✅ DO: Validate input
const validateRoomCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid room code');
  }
  return /^\d{6}$/.test(code);
};

// ✅ DO: Return consistent types
const getUserById = (id: string): User | null => {
  // Always returns User or null, never undefined
  return users[id] || null;
};

// ❌ DON'T: Mix business logic with utilities
// This belongs in a service, not utils
const createUser = (userData: UserData): User => {
  // ❌ Too much logic for a utility function
};
```

---

## 📋 Checklist for New Utility

- [ ] Is it truly reusable across multiple services/controllers?
- [ ] Is it a pure function (no side effects)?
- [ ] Is it well-tested with unit tests?
- [ ] Does it have TypeScript types defined?
- [ ] Is it documented in this README?
- [ ] Does it have a clear, single purpose?
- [ ] Is it exported from the utils folder?

**If it's not reusable or has side effects, it might belong in a service instead!**

---

## 🧪 Testing Utilities

All utility functions should be thoroughly tested.

**Test Location:** `api/tests/unit/utils/`

**Example Test:**

```typescript
import { generateSlug } from '../../../src/utils/helpers';

describe('generateSlug', () => {
  it('should convert text to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(generateSlug('My Quiz Name')).toBe('my-quiz-name');
  });

  it('should remove special characters', () => {
    expect(generateSlug('Quiz #1!')).toBe('quiz-1');
  });

  it('should handle empty strings', () => {
    expect(generateSlug('')).toBe('');
  });
});
```

---

## 📚 Related Documentation

- **Logger Tests:** [../../tests/unit/utils/logger.test.ts](../../tests/unit/utils/logger.test.ts)
- **Controllers:** [../controllers/README.md](../controllers/README.md)
- **Middleware:** [../middleware/README.md](../middleware/README.md)
- **Services:** [../services/SERVICE_DESIGN_PATTERN.md](../services/SERVICE_DESIGN_PATTERN.md)

---

## 📖 Additional Resources

### Winston (if used)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Log Levels](https://github.com/winstonjs/winston#logging-levels)

### Best Practices
- [Node.js Logging Best Practices](https://betterstack.com/community/guides/logging/nodejs-logging-best-practices/)
- [Logging Patterns](https://blog.logrocket.com/node-js-logging-best-practices/)

---

**Last Updated:** October 5, 2025  
**Utility Files:** 3 (logger, helpers, errorMonitor)  
**Logger Levels:** 6 (error, warn, info, http, debug, verbose)
