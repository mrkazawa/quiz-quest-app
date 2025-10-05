# Quiz Quest API

TypeScript-based REST API and Socket.IO server for Quiz Quest real-time quiz application.

---

## Quick Start

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test
```

---

## Project Structure

```
api/
├── src/
│   ├── server.ts           # Entry point
│   ├── app.ts              # Express app configuration
│   ├── config/             # CORS, session configuration
│   ├── controllers/        # Route handlers
│   ├── services/           # Business logic (singleton pattern)
│   ├── routes/             # API route definitions
│   ├── middleware/         # Auth, logging, validation
│   ├── socket/             # Socket.IO handlers
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Logger, helpers
├── tests/                  # Test suite (369 tests)
│   ├── helpers/            # Mock data, test utilities
│   ├── unit/               # Unit tests (338)
│   └── integration/        # Integration tests (31)
├── dist/                   # Compiled JavaScript (generated)
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `ts-node-dev ...` | Start with hot reload |
| `build` | `tsc` | Compile TypeScript |
| `start` | `node dist/server.js` | Run production build |
| `watch` | `tsc -w` | TypeScript watch mode |
| `clean` | `rimraf dist` | Remove build artifacts |
| `test` | `jest` | Run all tests (369) |
| `test:unit` | `jest tests/unit` | Run unit tests (338) |
| `test:integration` | `jest tests/integration` | Run integration tests (31) |
| `test:coverage` | `jest --coverage` | Generate coverage report |
| `test:watch` | `jest --watch` | Watch mode for TDD |

---

## API Endpoints

### Authentication
- `POST /api/login` - Teacher login
- `POST /api/logout` - Teacher logout
- `POST /api/set-language` - Set UI language

### Quizzes
- `GET /api/quizzes` - List all quizzes
- `POST /api/quizzes` - Create new quiz (auth required)
- `DELETE /api/quizzes/:id` - Delete quiz (auth required)
- `GET /api/quiz-template` - Download template

### Quiz History
- `GET /api/quiz-history` - List all history (auth required)
- `GET /api/quiz-history/:id` - Get specific history (auth required)

### Rooms
- `GET /api/active-rooms` - List active rooms (auth required)

### Health
- `GET /health` - Health check endpoint

---

## Socket.IO Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `joinRoom` | `{ roomId, studentId, username }` | Join quiz room |
| `rejoinRoom` | `{ roomId, studentId }` | Rejoin after disconnect |
| `submitAnswer` | `{ answer, timeSpent }` | Submit quiz answer |
| `startGame` | `{ roomId }` | Start quiz (teacher) |
| `nextQuestion` | `{ roomId }` | Next question (teacher) |
| `endGame` | `{ roomId }` | End quiz (teacher) |
| `getActiveRooms` | - | Get active rooms list |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `roomJoined` | `{ username, participants }` | Room join confirmed |
| `gameStarted` | `{ question, questionNumber, totalQuestions }` | Quiz started |
| `nextQuestion` | `{ question, questionNumber }` | New question |
| `questionResult` | `{ correctAnswer, scores, rankings }` | Question results |
| `gameEnded` | `{ finalRankings, playerDetails }` | Quiz ended |
| `playerJoined` | `{ username, participants }` | Player joined room |
| `playerLeft` | `{ username, participants }` | Player left room |
| `error` | `{ message }` | Error occurred |

---

## Architecture

### Service Layer (Singleton Pattern)

All business logic is in services:

**QuizService:**
- Load quiz questions from JSON files
- CRUD operations for quizzes
- Quiz data validation

**RoomService:**
- Room creation and management
- Player join/leave/rejoin
- Game lifecycle (start, question navigation, end)
- Answer submission and scoring
- Streak calculation

**HistoryService:**
- Save quiz results
- Generate rankings
- Retrieve quiz history
- Player performance tracking

**Pattern:**
```typescript
export class ExampleService {
  private data: Record<string, Type> = {};

  public create(data: Type): Result { }
  public get(id: string): Type | undefined { }
  public update(id: string, data: Partial<Type>): boolean { }
  public delete(id: string): boolean { }

  // Test helpers
  public clearAll(): void { }
  public cleanup(): void { }
}

export default new ExampleService();
```

**Benefits:**
- Consistent API across services
- Easy to test (with test helpers)
- Type-safe with TypeScript
- Clean separation of concerns

---

## Type Definitions

### Core Types

```typescript
// Quiz types
interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  points: number;
}

interface Quiz {
  id: string;
  setName: string;
  setDescription: string;
  questionCount: number;
}

// Room types
interface Room {
  id: string;
  quizId: string;
  quizName: string;
  questions: Question[];
  status: 'waiting' | 'active' | 'ended';
  currentQuestion: number;
  players: Record<string, Player>;
}

interface Player {
  id: string;
  username: string;
  studentId: string;
  socketId: string;
  score: number;
  streak: number;
  answers: Record<number, PlayerAnswer>;
}

// Socket types (typed events)
interface ServerToClientEvents {
  roomJoined: (data: RoomJoinedData) => void;
  gameStarted: (data: GameStartedData) => void;
  // ... more events
}

interface ClientToServerEvents {
  joinRoom: (data: JoinRoomData) => void;
  submitAnswer: (data: SubmitAnswerData) => void;
  // ... more events
}
```

---

## Testing

### Test Suite

- **Total Tests:** 369 (all passing ✅)
- **Unit Tests:** 338 tests
  - QuizService: 56 tests
  - RoomService: 248 tests
  - HistoryService: 34 tests
- **Integration Tests:** 31 tests
  - Auth: 9 tests
  - Quiz: 14 tests
  - History: 7 tests
  - Room: 5 tests

### Coverage

**Overall:** 77.91% statements, 75% branches

| Component | Coverage |
|-----------|----------|
| Controllers | 96.42% |
| Services | 82.9% |
| Socket Handlers | 86.44% |
| Middleware | 80.3% |

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific suites
npm run test:unit
npm run test:integration
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `TEACHER_PASSWORD` | `quizmaster123` | Teacher auth password |
| `SESSION_SECRET` | auto-generated | Session encryption key |
| `CORS_ORIGINS` | localhost (dev) | Allowed CORS origins |
| `LOG_LEVEL` | `debug` (dev), `info` (prod) | Logging verbosity |

### CORS Configuration

**Development (automatic):**
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

**Production (via environment variable):**
```bash
# Single origin
CORS_ORIGINS=https://myapp.com

# Multiple origins (comma-separated)
CORS_ORIGINS=https://myapp.com,https://www.myapp.com

# Public IP for classroom use
CORS_ORIGINS=http://203.0.113.45
```

---

## Logging

### Log Levels

1. **ERROR** - Critical errors
2. **WARN** - Warnings
3. **INFO** - General information (production default)
4. **HTTP** - HTTP requests
5. **DEBUG** - Debugging details (development default)
6. **VERBOSE** - Very detailed logs

### Usage

```typescript
import logger from './utils/logger';

logger.error('Critical error', { error });
logger.warn('Warning message');
logger.info('Server started on port 3000');
logger.debug('Debugging info', { data });
```

### Configuration

```bash
# Set log level
LOG_LEVEL=debug npm run dev

# Auto-detection based on NODE_ENV
NODE_ENV=production npm start  # Uses 'info' level
NODE_ENV=development npm run dev  # Uses 'debug' level
```

---

## Development

### Adding a New Endpoint

1. Define types in `src/types/`
2. Add business logic to service in `src/services/`
3. Create controller in `src/controllers/`
4. Add route in `src/routes/`
5. Write tests in `tests/unit/` and `tests/integration/`

### Adding a Socket Event

1. Define event types in `src/types/socket.ts`
2. Create handler in `src/socket/handlers/`
3. Register in `src/socket/socketConfig.ts`
4. Write tests

### Example Service

```typescript
// src/services/ExampleService.ts
export class ExampleService {
  private items: Record<string, Item> = {};

  public create(item: Item): Item {
    this.items[item.id] = item;
    return item;
  }

  public get(id: string): Item | undefined {
    return this.items[id];
  }

  public clearAll(): void {
    this.items = {};
  }
}

export default new ExampleService();
```

---

## Tech Stack

- **Runtime:** Node.js 14+
- **Language:** TypeScript 5.1+
- **Framework:** Express.js 4.21+
- **Real-time:** Socket.IO 4.8+
- **Session:** express-session
- **Testing:** Jest 30+ with Supertest 7+
- **Logging:** Winston-based custom logger

---

## Additional Documentation

- **Main README:** [../README.md](../README.md)
- **User Guide:** [../docs/USER_GUIDE.md](../docs/USER_GUIDE.md)
- **Setup Guide:** [../docs/SETUP.md](../docs/SETUP.md)
- **Deployment:** [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- **Development:** [../docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)
- **Testing:** [tests/README.md](tests/README.md)
- **Service Design Pattern:** [src/services/SERVICE_DESIGN_PATTERN.md](src/services/SERVICE_DESIGN_PATTERN.md)

---

## Production Ready Features

✅ TypeScript with strict mode  
✅ Comprehensive test suite (369 tests, 78% coverage)  
✅ Environment-based configuration  
✅ Structured logging with log levels  
✅ Session-based authentication  
✅ CORS properly configured  
✅ Error handling middleware  
✅ Socket.IO with typed events  
✅ Service layer architecture  
✅ Docker deployment support  

---

**Status:** Production Ready 🚀
