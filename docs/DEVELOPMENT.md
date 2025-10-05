# Development Guide

Complete guide for developing and contributing to Quiz Quest.

---

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Scripts Reference](#scripts-reference)
- [Testing](#testing)
- [Logging](#logging)
- [Code Architecture](#code-architecture)
- [Best Practices](#best-practices)

---

## Development Setup

### Prerequisites
- Node.js 14+ and npm
- Git
- Code editor (VS Code recommended)
- Docker (optional, for containerized development)

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd quiz-quest-app

# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Access:
# - Client: http://localhost:5173
# - API: http://localhost:3000
```

---

## Project Structure

```
quiz-quest-app/
├── api/                        # Backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── server.ts          # Entry point
│   │   ├── app.ts             # Express configuration
│   │   ├── config/            # CORS, session config
│   │   ├── controllers/       # Route handlers
│   │   ├── services/          # Business logic (singleton pattern)
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Auth, logging, validation
│   │   ├── socket/            # Socket.IO handlers
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Logger, helpers
│   ├── tests/                 # Test suite
│   │   ├── helpers/           # Mock data, test utilities
│   │   ├── unit/              # Unit tests
│   │   └── integration/       # Integration tests
│   ├── dist/                  # Compiled JavaScript (generated)
│   ├── tsconfig.json          # TypeScript config
│   └── package.json           # API dependencies
│
├── client/                     # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Root component
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components (routes)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # React context providers
│   │   └── types/             # TypeScript types
│   ├── public/                # Static assets
│   ├── dist/                  # Built files (generated)
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind CSS config
│   └── package.json           # Client dependencies
│
├── docker/                     # Docker configurations
│   ├── docker-compose-native.yml       # Native deployment
│   ├── docker-compose-serveo.yml       # Serveo tunneling
│   ├── docker-compose-localhost-run.yml
│   ├── Dockerfile             # Container image
│   └── nginx.conf             # Nginx reverse proxy config
│
├── questions/                  # Quiz question sets (JSON)
├── docs/                       # Documentation
│   ├── SETUP.md               # Installation guide
│   ├── USER_GUIDE.md          # End-user guide
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── DEVELOPMENT.md         # This file
│
├── scripts/                    # Deployment scripts
│   ├── deploy.sh              # Main deployment script
│   ├── serveo.sh              # Serveo setup
│   └── localhost-run.sh       # Localhost.run setup
│
├── package.json               # Root package manager
├── start-dev-servers.js       # Concurrent dev server starter
└── README.md                  # Main documentation
```

---

## Tech Stack

### Backend
- **Runtime:** Node.js 14+
- **Language:** TypeScript 5.1+
- **Framework:** Express.js 4.21+
- **Real-time:** Socket.IO 4.8+
- **Session:** express-session with in-memory store
- **Testing:** Jest 30+ with Supertest
- **Logging:** Winston-based custom logger

### Frontend
- **Framework:** React 19.1+
- **Language:** TypeScript 5.6+
- **Build Tool:** Vite 7.1+
- **Routing:** React Router 7.1+
- **Styling:** Tailwind CSS 4.1+
- **UI Components:** Bootstrap 5.3+ (legacy compatibility)
- **Real-time:** Socket.IO Client 4.8+

### Development Tools
- **Linting:** ESLint 9+ with TypeScript plugins
- **Testing:** Jest with ts-jest
- **Hot Reload:** ts-node-dev (API), Vite HMR (Client)
- **Docker:** Docker Compose for containerization

---

## Scripts Reference

### Root Package Scripts (`/`)

```bash
# Install all dependencies (API + Client)
npm run install:all

# Development
npm run dev                # Start both API and Client dev servers
npm run dev:api            # Start only API dev server
npm run dev:client         # Start only Client dev server

# Building
npm run build              # Build both API and Client
npm run build:api          # Build only API (TypeScript → JavaScript)
npm run build:client       # Build only Client (production bundle)

# Production
npm start                  # Start production API server

# Cleanup
npm run clean:all          # Remove all build artifacts
```

### API Scripts (`/api`)

```bash
cd api

# Development
npm run dev                # Start with hot-reload (ts-node-dev)
npm run watch              # TypeScript watch mode

# Building
npm run build              # Compile TypeScript to JavaScript
npm run clean              # Remove dist/ folder

# Testing
npm test                   # Run all tests (369 tests)
npm run test:unit          # Run only unit tests (338 tests)
npm run test:integration   # Run only integration tests (31 tests)
npm run test:coverage      # Run tests with coverage report
npm run test:watch         # Watch mode for TDD

# Production
npm start                  # Run compiled JavaScript from dist/
```

### Client Scripts (`/client`)

```bash
cd client

# Development
npm run dev                # Start Vite dev server (port 5173)

# Building
npm run build              # Build for production
npm run preview            # Preview production build

# Code Quality
npm run lint               # Run ESLint
```

---

## Testing

### Running Tests

```bash
cd api

# All tests (369 total)
npm test

# Specific test suites
npm run test:unit          # 338 unit tests
npm run test:integration   # 31 integration tests

# With coverage
npm run test:coverage      # Generates coverage/ folder

# Watch mode (for TDD)
npm run test:watch
```

### Test Structure

```
api/tests/
├── helpers/
│   ├── testApp.ts         # Express app for integration tests
│   └── mockData.ts        # Reusable mock data factories
├── unit/
│   ├── services/          # Service layer tests
│   │   ├── QuizService.test.ts       # 56 tests
│   │   ├── RoomService.test.ts       # 248 tests
│   │   └── HistoryService.test.ts    # 34 tests
│   ├── socket/            # Socket.IO handler tests
│   │   ├── roomHandlers.test.ts
│   │   ├── gameHandlers.test.ts
│   │   └── teacherHandlers.test.ts
│   └── middleware/        # Middleware tests
│       └── auth.test.ts
└── integration/           # End-to-end API tests
    ├── auth.integration.test.ts      # 9 tests
    ├── quiz.integration.test.ts      # 14 tests
    ├── history.integration.test.ts   # 7 tests
    └── room.integration.test.ts      # 5 tests
```

### Coverage Report

**Current Coverage:** ~78% overall

| Layer | Coverage | Tests |
|-------|----------|-------|
| Controllers | 96% | Included in integration |
| Services | 83% | 338 unit tests |
| Socket Handlers | 86% | Included in unit tests |
| Middleware | 80% | 7 tests |

**View detailed coverage:**
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Writing Tests

**Example: Unit Test**
```typescript
import { QuizService } from '../../../src/services/QuizService';
import { mockQuizData } from '../../helpers/mockData';

describe('QuizService', () => {
  let quizService: QuizService;

  beforeEach(() => {
    quizService = new QuizService();
    quizService.clearAllQuizzes(); // Test helper
  });

  it('should create a quiz', () => {
    const quiz = quizService.createQuiz(mockQuizData);
    expect(quiz).toBeDefined();
    expect(quiz.id).toBeTruthy();
  });
});
```

**Example: Integration Test**
```typescript
import request from 'supertest';
import { createTestApp } from '../helpers/testApp';

describe('Auth Integration', () => {
  const app = createTestApp();

  it('should login successfully', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ username: 'teacher', password: 'quizmaster123' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

---

## Logging

### Log Levels

The application uses Winston-based logging with 6 levels:

1. **ERROR** (0) - Critical errors
2. **WARN** (1) - Warnings
3. **INFO** (2) - General information
4. **HTTP** (3) - HTTP requests
5. **DEBUG** (4) - Debugging details
6. **VERBOSE** (5) - Very detailed logs

### Configuration

Set via `LOG_LEVEL` environment variable:

```bash
# Show only errors
LOG_LEVEL=error npm start

# Show info and above (production default)
LOG_LEVEL=info npm start

# Show debug and above (development default)
LOG_LEVEL=debug npm run dev

# Show everything
LOG_LEVEL=verbose npm run dev
```

### Auto-Detection

If `LOG_LEVEL` is not set:
- **Development:** `debug` level
- **Production:** `info` level
- **Test:** `error` level (quiet tests)

### Usage in Code

```typescript
import logger from './utils/logger';

// Error logging
logger.error('Critical error occurred', { error });

// Warning
logger.warn('Deprecated function used');

// Info (application flow)
logger.info('Server started on port 3000');

// HTTP (request logging - automatic via middleware)
logger.http('GET /api/quizzes');

// Debug (development details)
logger.debug('Processing quiz data', { quizId });

// Verbose (very detailed)
logger.verbose('Socket connection details', { socket.id });
```

---

## Code Architecture

### Service Layer Pattern

All business logic follows a consistent singleton pattern:

**File:** `api/src/services/ExampleService.ts`

```typescript
export class ExampleService {
  private data: Record<string, Type> = {};

  constructor() {
    // Minimal initialization
  }

  // Public API methods
  public create(data: Type): Result {
    // Business logic
  }

  public get(id: string): Type | undefined {
    return this.data[id];
  }

  // Test helper methods
  public clearAll(): void {
    this.data = {};
  }

  public cleanup(): void {
    this.clearAll();
  }
}

// Export singleton instance
export default new ExampleService();
```

**Benefits:**
- Consistent API across all services
- Easy to test (test helpers included)
- Clean separation of concerns
- Type-safe with TypeScript

### API Routes Structure

**File:** `api/src/routes/exampleRoutes.ts`

```typescript
import express from 'express';
import * as controller from '../controllers/ExampleController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/public', controller.getPublic);

// Protected routes (require authentication)
router.post('/create', requireAuth, controller.create);
router.delete('/:id', requireAuth, controller.deleteItem);

export default router;
```

### Socket.IO Handlers

**File:** `api/src/socket/handlers/exampleHandlers.ts`

```typescript
import { TypedServer, TypedSocket } from '../../types/socket';
import logger from '../../utils/logger';

export function register(socket: TypedSocket, io: TypedServer): void {
  socket.on('exampleEvent', (data) => {
    logger.debug('Example event received', { data });
    // Handle event
    socket.emit('exampleResponse', { success: true });
  });
}

export function handleDisconnect(socket: TypedSocket, io: TypedServer): void {
  // Cleanup on disconnect
}

export default { register, handleDisconnect };
```

---

## Best Practices

### TypeScript

✅ **DO:**
- Define interfaces for all data structures
- Use strict type checking
- Avoid `any` type (use `unknown` if needed)
- Export types for reuse

```typescript
// Good
interface Quiz {
  id: string;
  name: string;
  questions: Question[];
}

export function createQuiz(data: Quiz): Quiz {
  // ...
}
```

❌ **DON'T:**
```typescript
// Bad
function createQuiz(data: any): any {
  // ...
}
```

### Error Handling

✅ **DO:**
```typescript
try {
  const result = await riskyOperation();
  logger.info('Operation succeeded');
  res.json({ success: true, data: result });
} catch (error) {
  logger.error('Operation failed', { error });
  res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  });
}
```

### Async/Await

✅ **DO:**
```typescript
async function getData(): Promise<Data> {
  const result = await database.fetch();
  return process(result);
}
```

❌ **DON'T:** Mix callbacks and promises

### Testing

✅ **DO:**
- Write tests for all services
- Test happy paths AND error cases
- Use mock data from `helpers/mockData.ts`
- Keep tests fast (no file I/O, no external services)

```typescript
describe('Feature', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should handle success case', () => {
    // Test
  });

  it('should handle error case', () => {
    // Test
  });
});
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, commit often
git add .
git commit -m "feat: add new feature"

# Run tests before pushing
npm test

# Push and create PR
git push origin feature/your-feature
```

### Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Testing
- `refactor:` Code refactoring
- `style:` Formatting
- `chore:` Maintenance

---

## Common Development Tasks

### Adding a New API Endpoint

1. **Define the route** (`api/src/routes/`)
2. **Create controller** (`api/src/controllers/`)
3. **Add business logic** (`api/src/services/`)
4. **Add types** (`api/src/types/`)
5. **Write tests** (`api/tests/unit/` and `api/tests/integration/`)
6. **Update documentation**

### Adding a New React Component

1. **Create component** (`client/src/components/`)
2. **Define props interface**
3. **Add styling** (Tailwind CSS classes)
4. **Import and use** in pages
5. **Test in browser**

### Adding a New Socket Event

1. **Define event types** (`api/src/types/socket.ts`)
2. **Create handler** (`api/src/socket/handlers/`)
3. **Register handler** in `socketConfig.ts`
4. **Add client listener** in React component
5. **Test real-time behavior**

---

## Performance Tips

### Backend
- Use connection pooling for database (if applicable)
- Implement caching for frequently accessed data
- Use compression middleware
- Optimize Socket.IO event payloads

### Frontend
- Code splitting with lazy loading
- Optimize images and assets
- Use React.memo for expensive components
- Debounce/throttle frequent events

---

## Debugging

### Backend Debugging
```bash
# Start with debug logging
LOG_LEVEL=debug npm run dev

# Or with verbose
LOG_LEVEL=verbose npm run dev

# Check specific service logs
grep "RoomService" logs/app.log
```

### Frontend Debugging
- Use React DevTools browser extension
- Check Network tab for API calls
- Monitor WebSocket connections in DevTools
- Use console.log strategically (remove before commit)

### Socket.IO Debugging
```typescript
// Enable Socket.IO debug logs
localStorage.debug = 'socket.io-client:*';
```

---

## Additional Resources

- **User Guide:** [docs/USER_GUIDE.md](USER_GUIDE.md)
- **Deployment:** [docs/DEPLOYMENT.md](DEPLOYMENT.md)
- **Setup:** [docs/SETUP.md](SETUP.md)
- **API Docs:** [api/README.md](../api/README.md)
- **Test Docs:** [api/tests/README.md](../api/tests/README.md)
- **Docker:** [docker/README.md](../docker/README.md)

---

## Getting Help

Found a bug or need help?
1. Check existing documentation
2. Search GitHub issues
3. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Node version, etc.)

---

Happy coding! 🚀
