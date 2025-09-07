# Quiz Quest API - TypeScript Version

This is the TypeScript conversion of the Quiz Quest API server. The original JavaScript version is preserved in the `../api` folder for reference.

## Project Structure

```
api-ts/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic services
│   ├── routes/          # Express routes
│   ├── socket/          # Socket.IO configuration and handlers
│   ├── utils/           # Utility functions
│   ├── app.ts          # Express app configuration
│   └── server.ts       # Server entry point
├── dist/               # Compiled JavaScript output
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the api-ts directory:
   ```bash
   cd api-ts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Or build and run:
   ```bash
   npm run build
   npm start
   ```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled server
- `npm run dev` - Run in development mode with hot reloading
- `npm run watch` - Watch mode for TypeScript compilation
- `npm run clean` - Remove compiled files

## Type Definitions

### Core Types

The project includes comprehensive type definitions for:

- **Quiz Types** (`types/quiz.ts`): Question, Quiz, QuizData interfaces
- **Express Types** (`types/express.ts`): Extended Request/Response interfaces
- **Socket Types** (`types/socket.ts`): Socket.IO event interfaces

### Key Interfaces

```typescript
interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  points: number;
}

interface AuthenticatedRequest extends Request {
  session: AuthenticatedSession;
  body: any;
  params: any;
}
```

## Architecture Changes

### From JavaScript to TypeScript

1. **Type Safety**: All functions and classes now have proper type annotations
2. **Interface Definitions**: Comprehensive interfaces for data structures
3. **Generic Types**: Type-safe Socket.IO events and responses
4. **Error Handling**: Improved error handling with typed exceptions

### Services

- **QuizService**: Manages quiz data with type-safe CRUD operations
- **RoomService**: Handles game rooms with typed player and room interfaces
- **HistoryService**: Manages quiz history with structured data types

### Controllers

All controllers now use typed request/response objects and proper async/await patterns:

- **AuthController**: Teacher authentication and session management
- **QuizController**: Quiz CRUD operations
- **HistoryController**: Quiz history retrieval
- **RoomController**: Active room management

## Socket.IO Implementation

The Socket.IO implementation uses TypeScript's generic types for type-safe event handling:

```typescript
interface ServerToClientEvents {
  roomJoined: (data: { username: string; participants: string[] }) => void;
  gameStarted: (data: { question: any; questionNumber: number }) => void;
  // ... more events
}

interface ClientToServerEvents {
  joinRoom: (data: { roomId: string; username: string }) => void;
  submitAnswer: (data: { answer: number; timeSpent: number }) => void;
  // ... more events
}
```

## Configuration

### TypeScript Configuration (`tsconfig.json`)

- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Source maps for debugging

### Development Dependencies

- `typescript`: TypeScript compiler
- `ts-node`: Run TypeScript directly
- `ts-node-dev`: Development server with hot reloading
- `@types/*`: Type definitions for all major dependencies

## Migration Status

### ✅ Completed

- [x] Project structure and configuration
- [x] Core type definitions
- [x] Basic services (QuizService, HistoryService, RoomService)
- [x] Controllers with type safety
- [x] Express routes
- [x] Middleware conversion
- [x] Basic Socket.IO setup
- [x] Utility functions

### 🚧 In Progress / To Do

- [ ] Complete Socket.IO handlers (roomHandlers, gameHandlers, teacherHandlers)
- [ ] Full Socket.IO event type coverage
- [ ] Advanced error handling middleware
- [ ] Unit tests with TypeScript
- [ ] API documentation with TypeScript types
- [ ] Performance optimizations

### 📝 Notes

1. **Socket Handlers**: The socket handlers are partially implemented. The original JavaScript handlers contain complex game logic that needs careful conversion.

2. **Session Types**: The express-session types need to be properly extended for the authentication system.

3. **Error Handling**: Error handling has been improved but could benefit from custom error classes.

4. **Testing**: The original API doesn't have tests, but the TypeScript version would benefit from comprehensive testing.

## Differences from JavaScript Version

1. **Type Safety**: All data structures are now typed
2. **Import/Export**: Uses ES6 imports instead of CommonJS requires
3. **Async/Await**: Consistent use of async/await instead of callbacks
4. **Class Methods**: Proper typing for all class methods and properties
5. **Socket Events**: Type-safe socket event definitions

## Running Both Versions

You can run both the JavaScript and TypeScript versions side by side:

- JavaScript API: `cd ../api && npm run dev` (port 3000)
- TypeScript API: `cd api-ts && npm run dev` (configure different port if needed)

## Contributing

When adding new features:

1. Define types first in the appropriate `types/` file
2. Implement service logic with proper typing
3. Add controller methods with typed requests/responses
4. Update socket event types if needed
5. Add proper error handling

## Dependencies

### Runtime Dependencies
- express, cors, dotenv, socket.io, compression
- express-session, express-rate-limit, morgan

### Development Dependencies
- typescript, ts-node, ts-node-dev
- @types packages for all runtime dependencies
- rimraf for cleaning build output

## Environment Variables

Same as the JavaScript version:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `SESSION_SECRET`: Session encryption secret
- `TEACHER_PASSWORD`: Teacher authentication password
