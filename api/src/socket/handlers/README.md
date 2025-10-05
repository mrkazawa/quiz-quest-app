# Socket.IO Event Handlers

Handles real-time bidirectional communication between server and clients using Socket.IO. Manages quiz rooms, game flow, and live interactions.

---

## 🎯 Purpose

Socket handlers are responsible for:
- ✅ Real-time room management (create, join, leave)
- ✅ Quiz game flow (start, questions, answers, results)
- ✅ Teacher controls (room management, quiz navigation)
- ✅ Student interactions (join, answer, see results)
- ✅ Broadcasting updates to all participants
- ❌ **NOT** business logic (that belongs in services)
- ❌ **NOT** data persistence (that belongs in services)

---

## 📁 File Structure

```
socket/
├── socketConfig.ts        # Socket.IO server initialization
└── handlers/
    ├── roomHandlers.ts    # Room join/leave, reconnection
    ├── gameHandlers.ts    # Quiz gameplay (start, answer, next)
    └── teacherHandlers.ts # Teacher-specific actions
```

---

## 🏗️ Architecture Overview

### Socket.IO Server (`socketConfig.ts`)

```typescript
function initializeSocket(server, sessionMiddleware) {
  const io = new SocketIOServer(server, {
    cors: corsConfig,
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6  // 1MB limit
  });

  // Share session with Socket.IO
  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  // Connection handler
  io.on('connection', (socket) => {
    // Register all handlers
    roomHandlers.register(socket, io);
    gameHandlers.register(socket, io);
    teacherHandlers.register(socket, io);

    // Error and disconnect handlers
    socket.on('error', (error) => { ... });
    socket.on('disconnect', (reason) => { ... });
  });

  return io;
}
```

**Key Configuration:**
- **CORS:** Shares settings with REST API
- **Ping/Timeout:** Keeps connections alive
- **Session:** Shared with Express for authentication
- **Room-based:** Uses Socket.IO rooms for quiz isolation

---

## 📡 Event Patterns

### Event Naming Convention

```
Pattern: <action>_<resource>

Examples:
- join_room         # Student joins
- leave_room        # Student leaves
- create_room       # Teacher creates
- start_quiz        # Teacher starts
- submit_answer     # Student submits
- next_question     # Teacher advances
```

### Client → Server Events

Events received from clients (students/teachers).

```typescript
socket.on('event_name', (data) => {
  handleEventName(socket, io, data);
});
```

### Server → Client Events

Events emitted to clients.

```typescript
// To specific socket
socket.emit('event_name', data);

// To all in room
io.to(roomId).emit('event_name', data);

// To all except sender
socket.to(roomId).emit('event_name', data);
```

---

## 🏠 Room Handlers (`roomHandlers.ts`)

Manages room lifecycle and student connections.

### Events Handled

| Event | From | Purpose |
|-------|------|---------|
| `join_room` | Student | Join quiz room |
| `leave_room` | Student | Leave room explicitly |
| `disconnect` | Socket.IO | Handle disconnection |

### `join_room` - Student Joins Room

**Client Sends:**
```typescript
socket.emit('join_room', {
  roomId: '123456',
  playerName: 'John Doe',
  studentId: 'student123'
});
```

**Handler Logic:**
```typescript
function handleStudentJoinRoom(socket, io, data) {
  const { roomId, playerName, studentId } = data;
  
  // 1. Verify room exists
  const room = RoomService.getRoom(roomId);
  if (!room) {
    socket.emit('join_error', 'Room does not exist');
    return;
  }
  
  // 2. Add player to room
  const player = RoomService.addPlayerToRoom(roomId, {
    socketId: socket.id,
    playerName,
    studentId
  });
  
  // 3. Join Socket.IO room
  socket.join(roomId);
  
  // 4. Send room info to student
  socket.emit('joined_room', {
    roomId,
    quizName,
    players: [...],
    isActive: room.isActive
  });
  
  // 5. Handle rejoin if quiz is active
  if (room.isActive && room.currentQuestionIndex >= 0) {
    handleStudentRejoinActiveQuiz(socket, room, player);
  }
  
  // 6. Notify others
  io.to(roomId).emit('player_joined', {
    playerId: socket.id,
    playerName,
    players: [...]
  });
}
```

**Server Emits:**
```typescript
// To joining student
socket.emit('joined_room', { roomId, quizName, players, ... });

// To all in room
io.to(roomId).emit('player_joined', { playerId, playerName, ... });

// On error
socket.emit('join_error', 'Error message');
```

**Rejoin Handling:**

If student rejoins during active quiz:
```typescript
function handleStudentRejoinActiveQuiz(socket, room, player) {
  const currentQuestion = RoomService.getCurrentQuestion(roomId);
  const hasAnswered = player.answers.some(a => a.questionId === currentQuestion.id);
  
  // Calculate remaining time
  const elapsed = (Date.now() - room.questionStartTime) / 1000;
  const remainingTime = Math.max(0, currentQuestion.timeLimit - elapsed);
  
  if (remainingTime > 1) {
    // Question still active - send question
    socket.emit('new_question', {
      question: currentQuestion.question,
      options: currentQuestion.options,
      remainingTime,
      hasAnswered
    });
  } else {
    // Question ended - send results
    socket.emit('question_result', { ... });
  }
}
```

### `leave_room` - Student Leaves

**Client Sends:**
```typescript
socket.emit('leave_room', roomId, deleteRoom);
```

**Handler Logic:**
```typescript
function handleStudentLeaveRoom(socket, io, roomId, deleteRoom) {
  socket.leave(roomId);
  
  if (deleteRoom) {
    RoomService.removeRoom(roomId);
    io.to(roomId).emit('room_deleted', { roomId });
  } else {
    RoomService.removePlayerFromRoom(roomId, socket.id);
    io.to(roomId).emit('player_left', { playerId: socket.id });
  }
}
```

### `disconnect` - Connection Lost

**Handler Logic:**
```typescript
function handleDisconnect(socket, io) {
  // Find which room this socket was in
  const rooms = RoomService.getAllRooms();
  
  for (const roomId in rooms) {
    const room = rooms[roomId];
    
    if (room.players[socket.id]) {
      // Student disconnected - mark as disconnected but keep data
      logger.info(`Student ${socket.id} disconnected from room ${roomId}`);
      // Don't remove - allow rejoin
    }
    
    if (room.hostId === socket.id) {
      // Teacher disconnected - notify students
      io.to(roomId).emit('host_disconnected');
    }
  }
}
```

---

## 🎮 Game Handlers (`gameHandlers.ts`)

Manages quiz gameplay flow.

### Events Handled

| Event | From | Purpose |
|-------|------|---------|
| `start_quiz` | Teacher | Start the quiz |
| `submit_answer` | Student | Submit answer |
| `next_question` | Teacher | Go to next question |
| `get_quiz_rankings` | Student | Get final rankings |

### `start_quiz` - Teacher Starts Quiz

**Client Sends:**
```typescript
socket.emit('start_quiz', { roomId });
```

**Handler Logic:**
```typescript
function handleStartQuiz(socket, io, data) {
  const { roomId } = data;
  const room = RoomService.getRoom(roomId);
  
  // 1. Verify authorization
  if (room.hostId !== socket.id) {
    socket.emit('start_error', 'Not authorized');
    return;
  }
  
  // 2. Start quiz in service
  const started = RoomService.startQuiz(roomId);
  if (!started) {
    socket.emit('start_error', 'Failed to start');
    return;
  }
  
  // 3. Get first question
  const currentQuestion = RoomService.getCurrentQuestion(roomId);
  
  // 4. Notify all that quiz started
  io.to(roomId).emit('quiz_started', { roomId });
  
  // 5. Send question to students
  Object.values(room.players).forEach((player) => {
    io.to(player.socketId).emit('new_question', {
      question: currentQuestion.question,
      options: currentQuestion.options,
      timeLimit: currentQuestion.timeLimit,
      questionId: currentQuestion.id,
      currentScore: player.score,
      hasAnswered: false
    });
  });
  
  // 6. Send to teacher (with correct answer)
  io.to(room.hostId).emit('new_question', {
    ...currentQuestion,
    correctAnswer: currentQuestion.correctAnswer,
    answeredCount: 0,
    totalPlayers: Object.keys(room.players).length
  });
}
```

**Server Emits:**
```typescript
// To all
io.to(roomId).emit('quiz_started', { roomId });

// To students
socket.emit('new_question', {
  question, options, timeLimit, currentScore, ...
});

// To teacher (includes correct answer)
socket.emit('new_question', {
  question, options, correctAnswer, totalPlayers, ...
});
```

### `submit_answer` - Student Submits Answer

**Client Sends:**
```typescript
socket.emit('submit_answer', {
  roomId,
  questionId,
  selectedOption,
  timeTaken
});
```

**Handler Logic:**
```typescript
function handleSubmitAnswer(socket, io, data) {
  const { roomId, questionId, selectedOption, timeTaken } = data;
  const room = RoomService.getRoom(roomId);
  
  // 1. Validate room and player
  const player = room.players[socket.id];
  if (!player) {
    socket.emit('answer_error', 'Not in room');
    return;
  }
  
  // 2. Check if already answered
  const hasAnswered = player.answers.some(a => a.questionId === questionId);
  if (hasAnswered) {
    socket.emit('answer_error', 'Already answered');
    return;
  }
  
  // 3. Get question and check answer
  const question = RoomService.getCurrentQuestion(roomId);
  const isCorrect = question.correctAnswer === selectedOption;
  
  // 4. Calculate score and streak
  const result = RoomService.submitAnswer(roomId, socket.id, {
    questionId,
    selectedOption,
    isCorrect,
    timeTaken
  });
  
  // 5. Send result to student
  socket.emit('answer_submitted', {
    isCorrect,
    correctAnswer: question.correctAnswer,
    pointsEarned: result.pointsEarned,
    newScore: result.newScore,
    streak: result.streak
  });
  
  // 6. Update teacher's answer count
  const answeredCount = RoomService.getAnsweredCount(roomId, questionId);
  io.to(room.hostId).emit('answer_update', {
    answeredCount,
    totalPlayers: Object.keys(room.players).length
  });
}
```

**Server Emits:**
```typescript
// To student
socket.emit('answer_submitted', {
  isCorrect,
  correctAnswer,
  pointsEarned,
  newScore,
  streak
});

// To teacher
io.to(room.hostId).emit('answer_update', {
  answeredCount,
  totalPlayers
});
```

### `next_question` - Teacher Advances

**Client Sends:**
```typescript
socket.emit('next_question', roomId);
```

**Handler Logic:**
```typescript
function handleNextQuestion(socket, io, roomId) {
  const room = RoomService.getRoom(roomId);
  
  // 1. Verify authorization
  if (room.hostId !== socket.id) {
    socket.emit('next_error', 'Not authorized');
    return;
  }
  
  // 2. Get current question stats
  const currentQuestion = RoomService.getCurrentQuestion(roomId);
  const stats = RoomService.getQuestionStats(roomId, currentQuestion.id);
  
  // 3. Send results to all students
  Object.values(room.players).forEach((player) => {
    io.to(player.socketId).emit('question_result', {
      correctAnswer: currentQuestion.correctAnswer,
      currentScore: player.score,
      currentStreak: player.streak,
      rankings: RoomService.getRankings(roomId)
    });
  });
  
  // 4. Move to next question
  const hasNext = RoomService.nextQuestion(roomId);
  
  if (hasNext) {
    // Send next question (similar to start_quiz)
    const nextQuestion = RoomService.getCurrentQuestion(roomId);
    // ... emit new_question to all
  } else {
    // Quiz finished - send final results
    const finalRankings = RoomService.getFinalRankings(roomId);
    
    io.to(roomId).emit('quiz_ended', {
      rankings: finalRankings,
      roomId
    });
    
    // Save to history
    HistoryService.saveQuizResult(roomId, room, finalRankings);
  }
}
```

---

## 👨‍🏫 Teacher Handlers (`teacherHandlers.ts`)

Manages teacher-specific actions.

### Events Handled

| Event | From | Purpose |
|-------|------|---------|
| `create_room` | Teacher | Create new quiz room |
| `join_teacher_room` | Teacher | Join existing room |
| `get_room_info` | Teacher | Get room details |
| `delete_room` | Teacher | Delete room |

### `create_room` - Teacher Creates Room

**Client Sends:**
```typescript
socket.emit('create_room', {
  quizId: 'quiz-123',
  teacherId: 'teacher-456'
});
```

**Handler Logic:**
```typescript
function handleCreateRoom(socket, io, data) {
  const { quizId, teacherId } = data;
  
  // 1. Validate quiz exists
  const questionSet = QuizService.getQuizById(quizId);
  if (!questionSet) {
    socket.emit('room_error', 'Quiz not found');
    return;
  }
  
  // 2. Create room
  const roomId = RoomService.createRoom(quizId, teacherId, questionSet);
  const room = RoomService.getRoom(roomId);
  
  // 3. Set teacher as host
  room.hostId = socket.id;
  RoomService.updateTeacherSession(socket.id, teacherId);
  
  // 4. Join room
  socket.join(roomId);
  
  // 5. Notify teacher
  socket.emit('room_created', { roomId, quizId });
}
```

**Server Emits:**
```typescript
socket.emit('room_created', { roomId, quizId });
// or
socket.emit('room_error', 'Error message');
```

### `delete_room` - Teacher Deletes Room

**Client Sends:**
```typescript
socket.emit('delete_room', { roomId });
```

**Handler Logic:**
```typescript
function handleDeleteRoom(socket, io, data) {
  const { roomId } = data;
  const room = RoomService.getRoom(roomId);
  
  // 1. Verify authorization
  if (!room || room.hostId !== socket.id) {
    socket.emit('delete_error', 'Not authorized');
    return;
  }
  
  // 2. Notify all students
  io.to(roomId).emit('room_deleted', { roomId });
  
  // 3. Remove room
  RoomService.removeRoom(roomId);
  
  // 4. Confirm to teacher
  socket.emit('room_deleted_success', { roomId });
}
```

---

## 🏗️ Standard Handler Pattern

### File Structure

```typescript
import { TypedSocket, TypedServer } from '../../types/socket';
import SomeService from '../../services/SomeService';
import logger from '../../utils/logger';

// Register all events
function register(socket: TypedSocket, io: TypedServer): void {
  socket.on('event_name', (data) => {
    handleEventName(socket, io, data);
  });
  
  socket.on('another_event', (data) => {
    handleAnotherEvent(socket, io, data);
  });
}

// Event handler function
function handleEventName(socket: TypedSocket, io: TypedServer, data: any): void {
  try {
    // 1. Extract and validate data
    const { field1, field2 } = data;
    
    // 2. Get required resources
    const resource = SomeService.getResource(field1);
    if (!resource) {
      socket.emit('error_event', 'Resource not found');
      return;
    }
    
    // 3. Verify authorization (if needed)
    if (resource.ownerId !== socket.id) {
      socket.emit('error_event', 'Not authorized');
      return;
    }
    
    // 4. Call service layer
    const result = SomeService.doSomething(field1, field2);
    
    // 5. Emit response
    socket.emit('success_event', result);
    
    // 6. Broadcast to others (if needed)
    io.to(roomId).emit('broadcast_event', result);
    
    // 7. Log action
    logger.info(`Event handled: ${field1}`);
    
  } catch (error) {
    logger.error('Error in handleEventName:', error);
    socket.emit('error_event', 'Internal error');
  }
}

// Handle disconnection
function handleDisconnect(socket: TypedSocket, io: TypedServer): void {
  // Cleanup logic
}

export default {
  register,
  handleDisconnect
};
```

---

## 🔄 Communication Patterns

### 1. Direct Response (socket.emit)

```typescript
// Send to specific socket
socket.emit('event_name', data);
```

Use when: Responding to the sender only.

### 2. Room Broadcast (io.to.emit)

```typescript
// Send to all in room (including sender)
io.to(roomId).emit('event_name', data);
```

Use when: Update all participants in a room.

### 3. Room Broadcast Except Sender (socket.to.emit)

```typescript
// Send to all in room except sender
socket.to(roomId).emit('event_name', data);
```

Use when: Notify others about sender's action.

### 4. Individual Messages to Multiple Sockets

```typescript
// Send to specific sockets
players.forEach(player => {
  io.to(player.socketId).emit('event_name', {
    ...commonData,
    personalData: player.data
  });
});
```

Use when: Sending personalized data to multiple users.

---

## ⚠️ Best Practices

### ✅ DO:

```typescript
// Always validate data
if (!roomId || !playerName) {
  socket.emit('error', 'Missing required fields');
  return;
}

// Check authorization
if (room.hostId !== socket.id) {
  socket.emit('error', 'Not authorized');
  return;
}

// Use try-catch
try {
  // Handler logic
} catch (error) {
  logger.error('Error:', error);
  socket.emit('error', 'Something went wrong');
}

// Log important actions
logger.info(`Room ${roomId} created by ${teacherId}`);

// Call service layer (thin handlers)
const result = RoomService.createRoom(quizId, teacherId, questions);
```

### ❌ DON'T:

```typescript
// Don't skip validation
const { roomId } = data; // What if roomId is undefined?
const room = RoomService.getRoom(roomId);

// Don't skip authorization
RoomService.deleteRoom(roomId); // Anyone can delete!

// Don't swallow errors
try {
  // ...
} catch (error) {
  // Silence! ❌
}

// Don't put business logic in handlers
function handleCreateRoom(socket, io, data) {
  // ❌ Direct file/data manipulation
  const roomId = Math.random().toString();
  const room = { id: roomId, players: {}, ... };
  rooms[roomId] = room; // This belongs in service!
}
```

---

## 🧪 Testing Socket Handlers

### Mock Socket Pattern

```typescript
import { mockSocket, mockIO } from '../../helpers/mockSocket';
import roomHandlers from '../../../src/socket/handlers/roomHandlers';

describe('roomHandlers', () => {
  let socket: any;
  let io: any;

  beforeEach(() => {
    socket = mockSocket();
    io = mockIO();
    RoomService.clearAll();
  });

  afterEach(() => {
    RoomService.cleanup();
  });

  it('should handle student join room', () => {
    // Create room first
    const roomId = RoomService.createRoom('quiz-1', 'teacher-1', questions);

    // Simulate join_room event
    const data = {
      roomId,
      playerName: 'John',
      studentId: 'student-1'
    };

    roomHandlers.register(socket, io);
    socket.emit('join_room', data);

    // Verify
    expect(socket.emit).toHaveBeenCalledWith('joined_room', expect.objectContaining({
      roomId,
      quizName: expect.any(String)
    }));
  });
});
```

---

## 📋 Checklist for New Handler

- [ ] Create handler function file in `handlers/`
- [ ] Export `register()` and `handleDisconnect()`
- [ ] Use `TypedSocket` and `TypedServer` types
- [ ] Validate all incoming data
- [ ] Check authorization when needed
- [ ] Call service layer (no business logic in handler)
- [ ] Emit appropriate responses
- [ ] Log errors with `logger.error()`
- [ ] Log important actions with `logger.info()`
- [ ] Handle disconnection cleanup
- [ ] Write unit tests
- [ ] Update this README

---

## 📚 Related Documentation

- **Services:** [../../services/SERVICE_DESIGN_PATTERN.md](../../services/SERVICE_DESIGN_PATTERN.md)
- **Controllers:** [../../controllers/README.md](../../controllers/README.md)
- **Socket Types:** [../../types/socket.ts](../../types/socket.ts)
- **RoomService:** [../../services/RoomService.ts](../../services/RoomService.ts)
- **Testing:** [../../../tests/README.md](../../../tests/README.md)

---

**Last Updated:** October 5, 2025  
**Handler Files:** 3 (room, game, teacher)  
**Total Events:** 9 (join_room, leave_room, create_room, start_quiz, submit_answer, next_question, etc.)
