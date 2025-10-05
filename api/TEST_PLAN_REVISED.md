# Revised Test Implementation Plan - Quiz Quest API

**Date:** October 5, 2025  
**Status:** Phase 1-2 Complete, Planning Phases 3-6  
**Current Coverage:** 20.87% overall, 63.9% services

---

## 📊 Current Status

### ✅ Completed: Phase 1-2 (Service Layer)
- **117 tests passing** 
- HistoryService: 100%
- RoomService: 91.5%
- QuizService: 69.5%
- All services follow consistent design pattern
- Full documentation created

---

## 🎯 Revised Test Plan Overview

| Phase | Component | Priority | Estimated Tests | Complexity | Status |
|-------|-----------|----------|-----------------|------------|--------|
| **1-2** | **Services** | ✅ High | 117 | Medium | ✅ **Complete** |
| **3** | **Controllers** | 🔴 High | 30-40 | Medium | 📋 Next |
| **4** | **Middleware & Utils** | 🔴 High | 25-35 | Low-Medium | 📋 Planned |
| **5** | **Socket Handlers** | 🔴 High | 40-50 | High | 📋 Planned |
| **6** | **Integration** | 🟡 Medium | 20-30 | Medium | 📋 Planned |
| | **TOTAL** | | **~250-270** | | |

---

## 📋 Phase 3: Controller Unit Tests

### Why Test Controllers?
- **Interface to the outside world** - Controllers handle all HTTP requests
- **Error handling** - Must handle invalid input gracefully
- **Response formatting** - Ensure consistent API responses
- **Service orchestration** - Controllers coordinate between services

### Components to Test

#### 1. QuizController (`src/controllers/QuizController.ts`)
**Methods to test:**
- `getAllQuizzes()` - GET all quizzes
- `getQuizById()` - GET quiz by ID
- `createQuiz()` - POST create new quiz
- `updateQuiz()` - PUT update quiz
- `deleteQuiz()` - DELETE quiz

**Test scenarios (15-20 tests):**
```typescript
describe('QuizController', () => {
  describe('getAllQuizzes', () => {
    - Should return all quizzes successfully
    - Should handle empty quiz list
    - Should handle service errors
  });
  
  describe('getQuizById', () => {
    - Should return quiz when found
    - Should return 404 when not found
    - Should handle invalid ID format
  });
  
  describe('createQuiz', () => {
    - Should create quiz with valid data
    - Should reject invalid quiz data
    - Should handle duplicate quiz
    - Should validate required fields
  });
  
  describe('updateQuiz', () => {
    - Should update existing quiz
    - Should return 404 for non-existent quiz
    - Should validate update data
  });
  
  describe('deleteQuiz', () => {
    - Should delete existing quiz
    - Should return 404 for non-existent quiz
  });
});
```

#### 2. RoomController (`src/controllers/RoomController.ts`)
**Methods to test:**
- `createRoom()` - POST create room
- `getRoomInfo()` - GET room details
- `deleteRoom()` - DELETE room

**Test scenarios (8-10 tests):**
```typescript
describe('RoomController', () => {
  - Should create room with valid quiz ID
  - Should reject room creation with invalid quiz ID
  - Should return room info when found
  - Should return 404 when room not found
  - Should delete room successfully
  - Should handle already deleted room
  - Should handle service errors
});
```

#### 3. HistoryController (`src/controllers/HistoryController.ts`)
**Methods to test:**
- `getAllHistory()` - GET all quiz histories
- `getHistoryById()` - GET specific history
- `deleteHistory()` - DELETE history

**Test scenarios (8-10 tests):**
```typescript
describe('HistoryController', () => {
  - Should return all histories
  - Should handle empty history
  - Should return specific history by ID
  - Should return 404 for non-existent history
  - Should delete history successfully
  - Should handle service errors
});
```

#### 4. AuthController (`src/controllers/AuthController.ts`)
**Methods to test:**
- `login()` - POST teacher login
- `logout()` - POST teacher logout
- `getSession()` - GET current session

**Test scenarios (6-8 tests):**
```typescript
describe('AuthController', () => {
  - Should login with valid credentials
  - Should reject invalid credentials
  - Should create session on login
  - Should logout and destroy session
  - Should return session info
  - Should handle missing session
});
```

### Testing Approach
```typescript
// Mock services
jest.mock('../services/QuizService');
jest.mock('../services/RoomService');
jest.mock('../services/HistoryService');

// Mock Express req/res
const mockRequest = () => ({
  params: {},
  body: {},
  query: {},
  session: {}
});

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};
```

**Estimated Total:** 37-48 tests

---

## 📋 Phase 4: Middleware & Utility Tests

### Why Test Middleware & Utils?
- **Request processing** - Every request goes through middleware
- **Security** - Auth middleware protects endpoints
- **Validation** - Prevents bad data from reaching services
- **Utilities** - Helper functions used throughout the app

### Components to Test

#### 1. Auth Middleware (`src/middleware/auth.ts`)
**Functions to test:**
- `requireTeacherAuth()` - Verify teacher session

**Test scenarios (4-5 tests):**
```typescript
describe('Auth Middleware', () => {
  describe('requireTeacherAuth', () => {
    - Should allow request with valid session
    - Should reject request without session
    - Should reject request with invalid session
    - Should call next() on success
    - Should return 401 on failure
  });
});
```

#### 2. Validation Middleware (`src/middleware/validation.ts`)
**Functions to test:**
- `validateString()` - String validation
- `validateNumber()` - Number validation
- `validateRoomCode()` - Room code validation

**Test scenarios (12-15 tests):**
```typescript
describe('Validation Middleware', () => {
  describe('validateString', () => {
    - Should accept valid strings
    - Should reject empty strings
    - Should enforce min length
    - Should enforce max length
    - Should throw on non-string input
  });
  
  describe('validateNumber', () => {
    - Should accept valid numbers
    - Should enforce min value
    - Should enforce max value
    - Should throw on non-number input
  });
  
  describe('validateRoomCode', () => {
    - Should accept valid 6-digit codes
    - Should reject invalid formats
    - Should reject non-numeric codes
  });
});
```

#### 3. Logging Middleware (`src/middleware/logging.ts`)
**Functions to test:**
- `requestLogger()` - Log incoming requests
- `errorLogger()` - Log errors

**Test scenarios (3-4 tests):**
```typescript
describe('Logging Middleware', () => {
  - Should log incoming requests
  - Should log response status
  - Should log request duration
  - Should log errors with stack trace
});
```

#### 4. Helper Utilities (`src/utils/helpers.ts`)
**Functions to test:**
- `validateQuizData()` - Quiz data validation
- `generateSlug()` - Text to slug conversion
- `generateRoomCode()` - Random room code generation
- `formatTimestamp()` - Timestamp formatting
- `calculateTimeRemaining()` - Time calculation
- `sendSuccess()` - Success response helper
- `sendError()` - Error response helper

**Test scenarios (10-12 tests):**
```typescript
describe('Helper Utilities', () => {
  describe('validateQuizData', () => {
    - Should validate complete quiz data
    - Should reject incomplete data
    - Should check required fields
  });
  
  describe('generateSlug', () => {
    - Should convert text to slug
    - Should handle special characters
    - Should lowercase text
  });
  
  describe('generateRoomCode', () => {
    - Should generate 6-digit code
    - Should generate unique codes
  });
  
  describe('formatTimestamp', () => {
    - Should format timestamp correctly
  });
  
  describe('calculateTimeRemaining', () => {
    - Should calculate time correctly
    - Should return 0 when expired
  });
  
  describe('sendSuccess/sendError', () => {
    - Should format success responses
    - Should format error responses
  });
});
```

#### 5. Error Monitor (`src/utils/errorMonitor.ts`)
**Functions to test:**
- `asyncHandler()` - Async error wrapper
- `socketErrorHandler()` - Socket error wrapper

**Test scenarios (4-5 tests):**
```typescript
describe('Error Monitor', () => {
  - Should catch async errors
  - Should pass through successful results
  - Should catch socket errors
  - Should emit error events
});
```

#### 6. Logger (`src/utils/logger.ts`)
**Functions to test:**
- `debug()`, `info()`, `warn()`, `error()` - Log levels
- Log formatting
- Environment-based log levels

**Test scenarios (6-8 tests):**
```typescript
describe('Logger', () => {
  - Should log at different levels
  - Should format messages correctly
  - Should respect log level settings
  - Should include timestamps
  - Should handle errors
});
```

**Estimated Total:** 39-49 tests

---

## 📋 Phase 5: Socket Handler Tests

### Why Test Socket Handlers?
- **Real-time functionality** - Core feature of the app
- **Complex state management** - Rooms, players, quiz state
- **Event-driven** - Multiple handlers interacting
- **Error handling** - Must handle disconnections gracefully

### Components to Test

#### 1. Room Handlers (`src/socket/handlers/roomHandlers.ts`)
**Handlers to test:**
- `join_room` - Student joins room
- `leave_room` - Student leaves room

**Test scenarios (15-18 tests):**
```typescript
describe('Room Handlers', () => {
  describe('join_room', () => {
    - Should join existing room
    - Should add player to room
    - Should emit room data to player
    - Should notify other players
    - Should reject non-existent room
    - Should handle duplicate names
    - Should handle rejoining
    - Should handle active quiz
  });
  
  describe('leave_room', () => {
    - Should remove player from room
    - Should notify other players
    - Should handle last player leaving
    - Should delete room if requested
    - Should clean up socket mapping
  });
});
```

#### 2. Game Handlers (`src/socket/handlers/gameHandlers.ts`)
**Handlers to test:**
- `start_quiz` - Teacher starts quiz
- `submit_answer` - Student submits answer
- `next_question` - Teacher moves to next question
- `get_quiz_rankings` - Get current rankings

**Test scenarios (15-18 tests):**
```typescript
describe('Game Handlers', () => {
  describe('start_quiz', () => {
    - Should start quiz successfully
    - Should verify teacher authorization
    - Should emit quiz start to all players
    - Should send first question
  });
  
  describe('submit_answer', () => {
    - Should accept valid answer
    - Should calculate score correctly
    - Should update player score
    - Should emit result to player
    - Should reject invalid answer
    - Should handle already answered
  });
  
  describe('next_question', () => {
    - Should move to next question
    - Should emit question to all players
    - Should handle last question
    - Should finalize quiz
    - Should save history
  });
  
  describe('get_quiz_rankings', () => {
    - Should return current rankings
    - Should sort by score
    - Should include all players
  });
});
```

#### 3. Teacher Handlers (`src/socket/handlers/teacherHandlers.ts`)
**Handlers to test:**
- `create_room` - Teacher creates room
- `join_teacher_room` - Teacher joins own room
- `get_room_info` - Get room details
- `delete_room` - Teacher deletes room

**Test scenarios (12-14 tests):**
```typescript
describe('Teacher Handlers', () => {
  describe('create_room', () => {
    - Should create room with valid quiz
    - Should set teacher as host
    - Should generate room code
    - Should reject invalid quiz ID
  });
  
  describe('join_teacher_room', () => {
    - Should join own room
    - Should emit room info
    - Should handle non-existent room
  });
  
  describe('get_room_info', () => {
    - Should return room details
    - Should include player list
    - Should include quiz status
  });
  
  describe('delete_room', () => {
    - Should delete room
    - Should notify all players
    - Should clean up resources
  });
});
```

### Testing Approach
```typescript
// Mock Socket.IO
import { createMockSocket, createMockServer } from '../../helpers/socketMocks';

// Mock services
jest.mock('../../../src/services/QuizService');
jest.mock('../../../src/services/RoomService');
jest.mock('../../../src/services/HistoryService');

describe('Socket Handlers', () => {
  let mockSocket: any;
  let mockIo: any;
  
  beforeEach(() => {
    mockSocket = createMockSocket();
    mockIo = createMockServer();
  });
});
```

**Estimated Total:** 42-50 tests

---

## 📋 Phase 6: Integration Tests

### Why Integration Tests?
- **End-to-end verification** - Test complete flows
- **Real interactions** - Services work together
- **API contract** - Verify request/response formats
- **Route testing** - Verify routes map to correct controllers
- **Middleware testing** - Verify auth/validation applied correctly
- **Regression prevention** - Catch breaking changes

### What Gets Tested in Integration?
This phase tests **routes + controllers + services + middleware** working together:
- ✅ All 11 API routes (quiz, room, auth, history)
- ✅ Complete request/response cycles
- ✅ Middleware application (auth, validation)
- ✅ Service interactions
- ✅ Data persistence

### Test Scenarios

#### 1. Quiz Routes Integration (8-10 tests)
```typescript
describe('Quiz Routes Integration', () => {
  // Tests routes/quiz.ts + QuizController + QuizService
  
  it('GET /api/quizzes should return all quizzes', async () => {
    const res = await request(app).get('/api/quizzes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('quizzes');
  });
  
  it('POST /api/create-quiz should create quiz', async () => {
    const res = await request(app)
      .post('/api/create-quiz')
      .send(validQuizData);
    expect(res.status).toBe(201);
  });
  
  it('DELETE /api/quiz/:quizId should delete quiz', async () => {
    const res = await request(app).delete('/api/quiz/quiz-1');
    expect(res.status).toBe(200);
  });
  
  it('GET /api/quiz-template should download template', async () => {
    const res = await request(app).get('/api/quiz-template');
    expect(res.status).toBe(200);
  });
  
  // Additional tests: validation, error handling, etc.
});
```

#### 2. Room Routes Integration (3-4 tests)
```typescript
describe('Room Routes Integration', () => {
  // Tests routes/room.ts + RoomController + RoomService
  
  it('GET /api/active-rooms should return active rooms', async () => {
    const res = await request(app).get('/api/active-rooms');
    expect(res.status).toBe(200);
  });
  
  // Test with/without active rooms
});
```

#### 3. Auth Routes Integration (5-6 tests)
```typescript
describe('Auth Routes Integration', () => {
  // Tests routes/auth.ts + AuthController + middleware
  
  it('POST /api/verify-teacher should login teacher', async () => {
    const res = await request(app)
      .post('/api/verify-teacher')
      .send({ teacherId: 'teacher1', password: 'pass' });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });
  
  it('GET /api/logout should clear session', async () => {
    const res = await request(app).get('/api/logout');
    expect(res.status).toBe(200);
  });
  
  it('POST /api/set-language should set preference', async () => {
    const res = await request(app)
      .post('/api/set-language')
      .send({ language: 'en' });
    expect(res.status).toBe(200);
  });
  
  // Test auth middleware protection
});
```

#### 4. History Routes Integration (4-5 tests)
```typescript
describe('History Routes Integration', () => {
  // Tests routes/history.ts + HistoryController + HistoryService
  
  it('GET /api/quiz-history should return all histories', async () => {
    const res = await request(app).get('/api/quiz-history');
    expect(res.status).toBe(200);
  });
  
  it('GET /api/quiz-history/:id should return specific history', async () => {
    const res = await request(app).get('/api/quiz-history/room-1');
    expect(res.status).toBe(200);
  });
  
  // Test error cases
});
```

#### 3. Authentication Flow (4-5 tests)
```typescript
describe('Authentication Integration', () => {
  - Should login teacher
  - Should protect authenticated routes
  - Should logout
  - Should handle session expiry
});
```

**Estimated Total:** 20-25 tests

---

## 📊 Estimated Coverage Improvement

| Component | Current | Target | Priority |
|-----------|---------|--------|----------|
| Services | 63.9% | 80%+ | ✅ Done |
| Controllers | 0% | 90%+ | 🔴 High |
| Middleware | 0% | 85%+ | 🔴 High |
| Utils | 0% | 90%+ | 🔴 High |
| Socket Handlers | 0% | 80%+ | 🔴 High |
| Integration | - | N/A | 🟡 Medium |
| **Overall** | **20.87%** | **70%+** | |

---

## 🎯 Success Criteria

### Phase 3: Controllers
- [ ] All 4 controllers tested
- [ ] 35+ tests passing
- [ ] Error handling covered
- [ ] Response formatting verified
- [ ] Controller coverage >90%

### Phase 4: Middleware & Utils
- [ ] All middleware tested
- [ ] All utility functions tested
- [ ] 35+ tests passing
- [ ] Edge cases covered
- [ ] Coverage >85%

### Phase 5: Socket Handlers
- [ ] All 10 event handlers tested
- [ ] 40+ tests passing
- [ ] Mock Socket.IO working
- [ ] Event emits verified
- [ ] Coverage >80%

### Phase 6: Integration
- [ ] Complete flows tested
- [ ] 20+ tests passing
- [ ] API contracts verified
- [ ] No regressions detected

---

## 🚀 Implementation Timeline

| Phase | Estimated Effort | Complexity | Dependencies |
|-------|-----------------|------------|--------------|
| Phase 3 | 4-6 hours | Medium | Services complete |
| Phase 4 | 3-5 hours | Low-Medium | None |
| Phase 5 | 6-8 hours | High | Services, need socket mocks |
| Phase 6 | 4-6 hours | Medium | All other phases |
| **Total** | **17-25 hours** | | |

---

## 📝 Notes

### Why This Order?
1. **Controllers** - Direct interface to services, easier to test
2. **Middleware & Utils** - Smaller, isolated functions
3. **Socket Handlers** - Most complex, needs all patterns established
4. **Integration** - Validates everything works together

### What's Not Tested (As Unit Tests)?
- `app.ts` / `server.ts` - Configuration files (hard to test, low value)
- `config/*.ts` - Configuration objects (low value)
- `routes/*.ts` - **Simple routing (covered in Phase 6 integration tests)**
- `types/*.ts` - Type definitions (TypeScript validates these)

### Why Routes Are Not Unit Tested?
Routes in this project are **pure configuration** with minimal logic:
```typescript
// Example: routes/quiz.ts
router.get('/quizzes', QuizController.getAllQuizzes);
router.post('/create-quiz', QuizController.createQuiz);
```

**What routes do:**
- Map HTTP methods to endpoints ✅ Tested in Phase 6 (Integration)
- Apply middleware (auth, validation) ✅ Tested in Phase 6 (Integration)
- Call controller methods ✅ Controllers tested in Phase 3

**Why integration testing is better for routes:**
- Tests actual HTTP behavior (request → response)
- Verifies middleware is applied correctly
- Tests the API contract that clients depend on
- More valuable than testing Express's routing logic

**Routes covered in Phase 6:**
- `routes/quiz.ts` - Quiz management endpoints (4 routes)
- `routes/room.ts` - Room management endpoints (1 route)
- `routes/auth.ts` - Authentication endpoints (4 routes)
- `routes/history.ts` - History endpoints (2 routes)
- **Total: 11 routes** will be tested end-to-end in integration tests

### Testing Tools Needed
- ✅ Jest - Already installed
- ✅ ts-jest - Already installed
- ✅ Supertest - Already installed
- ⚠️ Socket.IO client mock - Need to create
- ⚠️ Express req/res mocks - Need to create

---

## 🎓 Key Takeaways

1. **Comprehensive coverage** - Testing all major components
2. **Prioritized approach** - High-value tests first
3. **Realistic estimates** - ~250-270 total tests
4. **Maintainable** - Consistent patterns across all tests
5. **Production-ready** - Will catch most bugs before deployment

---

**Next Action:** Begin Phase 3 - Controller Unit Tests

**Ready to start?** Ask to begin Phase 3 implementation!
