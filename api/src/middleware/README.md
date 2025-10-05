# Middleware

Middleware functions process requests before they reach controllers. They handle **cross-cutting concerns** like authentication, logging, validation, and security.

---

## 🎯 Purpose

Middleware is responsible for:
- ✅ Authentication and authorization
- ✅ Request logging
- ✅ Input validation
- ✅ Rate limiting
- ✅ Security headers
- ✅ Error handling
- ❌ **NOT** business logic (that belongs in services)
- ❌ **NOT** response formatting (that belongs in controllers)

---

## 📁 File Structure

```
middleware/
├── auth.ts          # Authentication middleware
├── logging.ts       # Request logging, security headers, health check
└── validation.ts    # Input validation helpers, rate limiting
```

---

## 🔄 Middleware Execution Order

Middleware is applied in **app.ts** in this order:

```typescript
app.use(compression());           // 1. Response compression
app.use(securityHeaders);         // 2. Security headers
app.use(cors(corsConfig));        // 3. CORS configuration
app.use(express.json());          // 4. Parse JSON bodies
app.use(express.urlencoded());    // 5. Parse URL-encoded bodies
app.use(sessionConfig);           // 6. Session management
app.use(requestLogger);           // 7. HTTP request logging

// Health check (no auth)
app.get('/health', healthCheck);  // 8. Health check endpoint

// Routes with rate limiting
app.use('/api/auth', rateLimits.auth, authRoutes);
app.use('/api/quiz', rateLimits.quizCreation, quizRoutes);
app.use('/api/rooms', rateLimits.roomCreation, roomRoutes);
app.use('/api/history', historyRoutes);

// Static files (last)
app.use(express.static(...));     // 9. Serve static files
```

**Order matters!** Security → Parsing → Session → Logging → Routes

---

## 🔐 Authentication Middleware

### `auth.ts` - Teacher Authentication

#### `requireTeacherAuth()`

Protects routes that require teacher authentication.

**Usage:**
```typescript
import { requireTeacherAuth } from '../middleware/auth';

// In routes file
router.post('/create', requireTeacherAuth, QuizController.createQuiz);
router.delete('/:quizId', requireTeacherAuth, QuizController.deleteQuiz);
```

**Behavior:**
- ✅ If authenticated: Calls `next()` to continue
- ❌ If not authenticated: Returns `401 Unauthorized`

**Implementation:**
```typescript
export const requireTeacherAuth = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (req.session && req.session.isTeacher === true) {
    next(); // Authenticated - continue
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};
```

**When to Use:**
- Any route that requires teacher privileges
- Quiz creation, deletion
- Room management
- Viewing quiz history

**When NOT to Use:**
- Public endpoints (GET all quizzes, health check)
- Student endpoints (joining rooms)
- Login/logout endpoints

---

## 📝 Logging Middleware

### `logging.ts` - Request Logging & Security

#### `requestLogger`

Logs all HTTP requests using Morgan.

**Behavior:**
- Development: Logs all requests with detailed format
- Production: Only logs errors (status >= 400)
- Skips: Health checks, static files

**Log Format:**
```
Development: :method :url :status :res[content-length] - :response-time ms
Production:  Combined format (Apache-style)
```

**Custom Tokens:**
```typescript
morgan.token('real-ip', (req) => {
  return req.headers['x-forwarded-for'] ||  // Proxy IP
         req.headers['x-real-ip'] ||         // Nginx IP
         req.connection.remoteAddress;        // Direct IP
});
```

#### `securityHeaders`

Adds security headers to all responses.

**Headers Added:**
```typescript
X-Content-Type-Options: nosniff          // Prevent MIME sniffing
X-Frame-Options: DENY                    // Prevent clickjacking
X-XSS-Protection: 1; mode=block          // XSS protection
Strict-Transport-Security: ...           // HTTPS only (production)
```

**Removes:**
```typescript
X-Powered-By  // Don't reveal Express.js
```

#### `healthCheck`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 50000000,
    "heapTotal": 20000000,
    "heapUsed": 15000000
  },
  "env": "production"
}
```

**Usage:**
```typescript
app.get('/health', healthCheck);
```

---

## ✅ Validation Middleware

### `validation.ts` - Input Validation & Rate Limiting

#### Rate Limiting

Prevents abuse by limiting request frequency.

**Available Limiters:**

```typescript
rateLimits.general       // 100 requests per 15 minutes
rateLimits.auth          // 10 requests per 15 minutes
rateLimits.roomCreation  // 3 requests per 5 minutes
rateLimits.quizCreation  // 5 requests per 10 minutes
```

**Usage in Routes:**
```typescript
// In app.ts
app.use('/api/auth', rateLimits.auth, authRoutes);
app.use('/api/quiz', rateLimits.quizCreation, quizRoutes);
app.use('/api/rooms', rateLimits.roomCreation, roomRoutes);
```

**Configuration:**
```typescript
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,              // Time window in milliseconds
  max,                   // Max requests per window
  message: { error },    // Error message when limit exceeded
  standardHeaders: true, // Send rate limit headers
  legacyHeaders: false   // Don't send X-RateLimit-* headers
});
```

**Response when limit exceeded:**
```json
{
  "error": "Too many requests, please try again later"
}
```

#### Validation Helpers

Helper functions for input validation.

**`validateString(value, fieldName, minLength, maxLength)`**

Validates string input.

```typescript
import { validateString } from '../middleware/validation';

// In controller
const name = validateString(req.body.name, 'Name', 3, 100);
// Throws error if invalid
```

**Checks:**
- Must be a string
- Must be at least `minLength` characters
- Must not exceed `maxLength` characters
- Trims whitespace

**`validateNumber(value, fieldName, min, max)`**

Validates numeric input.

```typescript
const score = validateNumber(req.body.score, 'Score', 0, 100);
```

**Checks:**
- Must be an integer
- Must be between `min` and `max`

**`validateRoomCode(roomCode)`**

Validates 6-digit room codes.

```typescript
const code = validateRoomCode(req.body.roomCode);
// Must be exactly 6 digits: "123456"
```

---

## 🏗️ Standard Middleware Pattern

### Creating New Middleware

```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware description
 */
export const myMiddleware = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    // 1. Extract needed data from request
    const someData = req.body.someField;
    
    // 2. Perform validation/check
    if (!isValid(someData)) {
      res.status(400).json({ error: 'Invalid data' });
      return; // Important: stop here
    }
    
    // 3. Optional: Modify request object
    (req as any).customData = processedData;
    
    // 4. Continue to next middleware/controller
    next();
    
  } catch (error) {
    logger.error('Error in middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

### Middleware Best Practices

**✅ DO:**
```typescript
// Call next() to continue
next();

// Return after sending response
if (error) {
  res.status(400).json({ error: 'Bad request' });
  return; // Stop execution
}

// Log errors for debugging
logger.error('Middleware error:', error);
```

**❌ DON'T:**
```typescript
// Don't forget to call next()
if (valid) {
  // Missing next()!
}

// Don't send response and continue
res.status(400).json({ error: 'Bad' });
next(); // ❌ Response already sent!

// Don't swallow errors silently
catch (error) {
  // ❌ No logging or handling
}
```

---

## 🔗 Middleware in Routes

### Route-Level Middleware

Applied to specific routes only.

```typescript
import { requireTeacherAuth } from '../middleware/auth';
import QuizController from '../controllers/QuizController';

// Public route (no middleware)
router.get('/', QuizController.getAllQuizzes);

// Protected route (with auth middleware)
router.post('/', requireTeacherAuth, QuizController.createQuiz);

// Multiple middleware
router.delete('/:id', 
  requireTeacherAuth,    // First: check auth
  validateQuizId,        // Second: validate ID
  QuizController.delete  // Finally: controller
);
```

### App-Level Middleware

Applied to all routes.

```typescript
// In app.ts
app.use(securityHeaders);     // All routes
app.use(requestLogger);       // All routes
app.use('/api/auth', authRoutes); // Specific path
```

---

## ⚙️ Environment-Aware Middleware

### Development vs Production

```typescript
const logFormat = process.env.NODE_ENV === 'production' 
  ? 'combined'           // Production: Apache-style logs
  : ':method :url ...';  // Development: Detailed logs

const skipLog = (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.statusCode < 400; // Only log errors
  }
  return req.url === '/health';   // Skip health checks
};
```

### Graceful Degradation

Handle missing dependencies gracefully.

```typescript
let rateLimit: any;

try {
  rateLimit = require('express-rate-limit');
} catch (error) {
  logger.warn('Rate limiting not available');
  
  // Fallback: No-op middleware
  rateLimit = () => (req, res, next) => next();
}
```

---

## 🧪 Testing Middleware

### Unit Test Pattern

```typescript
import { requireTeacherAuth } from '../../../src/middleware/auth';
import { mockRequest, mockResponse, mockNext } from '../../helpers/mockRequest';

describe('requireTeacherAuth', () => {
  it('should call next() when teacher is authenticated', () => {
    const req = mockRequest({ session: { isTeacher: true } });
    const res = mockResponse();
    const next = mockNext();

    requireTeacherAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when not authenticated', () => {
    const req = mockRequest({ session: {} });
    const res = mockResponse();
    const next = mockNext();

    requireTeacherAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Authentication required' 
    });
  });
});
```

---

## 📋 Checklist for New Middleware

When creating new middleware:

- [ ] File in `middleware/` folder
- [ ] Import types: `Request, Response, NextFunction`
- [ ] Return type: `void`
- [ ] Always call `next()` to continue
- [ ] Use `return` after sending response
- [ ] Log errors for debugging
- [ ] Handle errors gracefully
- [ ] Test both success and failure cases
- [ ] Document in this README
- [ ] Export named function
- [ ] Add to app.ts in correct order

---

## 🎯 Common Use Cases

### 1. Authentication Middleware

```typescript
export const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

### 2. Validation Middleware

```typescript
export const validateRequestBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.message });
    } else {
      next();
    }
  };
};
```

### 3. Logging Middleware

```typescript
export const logRequest = (req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};
```

### 4. Error Handling Middleware

```typescript
export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
};

// Register as last middleware in app.ts
app.use(errorHandler);
```

---

## 📚 Reference Examples

### Authentication
**See:** `auth.ts`
- Session-based authentication
- Teacher role verification
- Early return pattern

### Logging & Security
**See:** `logging.ts`
- HTTP request logging
- Security headers
- Health check endpoint
- Environment-aware configuration

### Validation & Rate Limiting
**See:** `validation.ts`
- Input validation helpers
- Rate limiting configuration
- String/number validation
- Room code validation

---

## 🔄 Request Flow with Middleware

```
Incoming Request
    ↓
1. compression()              # Compress response
    ↓
2. securityHeaders           # Add security headers
    ↓
3. cors(corsConfig)          # Handle CORS
    ↓
4. express.json()            # Parse JSON body
    ↓
5. sessionConfig             # Load session
    ↓
6. requestLogger             # Log request
    ↓
7. rateLimits.auth           # Check rate limit (if applicable)
    ↓
8. requireTeacherAuth        # Check authentication (if applicable)
    ↓
9. Controller                # Handle request
    ↓
Response
```

---

## 📖 Related Documentation

- **Controllers:** [../controllers/README.md](../controllers/README.md)
- **Services:** [../services/SERVICE_DESIGN_PATTERN.md](../services/SERVICE_DESIGN_PATTERN.md)
- **Routes:** [../routes/](../routes/)
- **Logger:** [../utils/logger.ts](../utils/logger.ts)
- **Testing:** [../../tests/README.md](../../tests/README.md)

---

**Last Updated:** October 5, 2025  
**Middleware Files:** 3 (auth, logging, validation)
