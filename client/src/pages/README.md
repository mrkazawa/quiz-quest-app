# Pages

React page components that represent full routes in the application. Each page corresponds to a specific URL and user flow.

---

## 🎯 Purpose

Pages are responsible for:
- ✅ Full-page layouts and structure
- ✅ Route-specific logic and state management
- ✅ API calls and Socket.IO event handling
- ✅ Composing reusable components
- ✅ Navigation between routes
- ❌ **NOT** reusable UI elements (those belong in components/)
- ❌ **NOT** low-level styling (use Tailwind classes)

---

## 📁 File Structure

```
pages/
├── HomePage.tsx                    # Landing page with login
├── NotFound.tsx                    # 404 error page
│
├── TeacherDashboard.tsx            # Quiz management & creation
├── TeacherWaitingRoom.tsx          # Pre-quiz lobby (teacher view)
├── TeacherQuizRoom.tsx             # Active quiz control
├── TeacherCreateQuiz.tsx           # Create new quiz from JSON
├── TeacherQuizHistory.tsx          # Past quiz sessions list
├── TeacherQuizHistoryDetail.tsx    # Detailed quiz results
│
├── StudentJoin.tsx                 # Room code entry
├── StudentWaitingRoom.tsx          # Pre-quiz lobby (student view)
└── StudentQuizRoom.tsx             # Active quiz participation
```

---

## 🗺️ Route Structure

### Public Routes

```typescript
// Landing page
<Route path="/" element={<HomePage />} />

// Student routes (no auth required)
<Route path="/student/join" element={<StudentJoin />} />
<Route path="/student/join/:roomId" element={<StudentJoin />} />
<Route path="/student/room/:roomId/waiting" element={<StudentWaitingRoom />} />
<Route path="/student/room/:roomId/question/:questionId" element={<StudentQuizRoom />} />
<Route path="/student/room/:roomId/submit/:questionId" element={<StudentQuizRoom />} />
<Route path="/student/room/:roomId/result/:questionId" element={<StudentQuizRoom />} />
<Route path="/student/room/:roomId/final" element={<StudentQuizRoom />} />

// 404 fallback
<Route path="*" element={<NotFound />} />
```

### Protected Routes (Teacher Only)

```typescript
<Route path="/teacher/dashboard" element={
  <ProtectedRoute>
    <TeacherDashboard />
  </ProtectedRoute>
} />

<Route path="/teacher/room/:roomId/waiting" element={
  <ProtectedRoute>
    <TeacherWaitingRoom />
  </ProtectedRoute>
} />

<Route path="/teacher/room/:roomId/question/:questionId" element={
  <ProtectedRoute>
    <TeacherQuizRoom />
  </ProtectedRoute>
} />

<Route path="/teacher/room/:roomId/result/:questionId" element={
  <ProtectedRoute>
    <TeacherQuizRoom />
  </ProtectedRoute>
} />

<Route path="/teacher/room/:roomId/final" element={
  <ProtectedRoute>
    <TeacherQuizRoom />
  </ProtectedRoute>
} />

<Route path="/teacher/create-quiz" element={
  <ProtectedRoute>
    <TeacherCreateQuiz />
  </ProtectedRoute>
} />

<Route path="/teacher/history" element={
  <ProtectedRoute>
    <TeacherQuizHistory />
  </ProtectedRoute>
} />

<Route path="/teacher/history/:roomId" element={
  <ProtectedRoute>
    <TeacherQuizHistoryDetail />
  </ProtectedRoute>
} />
```

---

## 📄 Page Descriptions

### Landing & Error Pages

#### `HomePage.tsx` - Landing Page

**Route:** `/`  
**Auth:** Public  
**Purpose:** Application entry point with teacher login

**Key Features:**
- Logo and welcome message
- Teacher password login modal
- Redirects to dashboard after login

**State:**
```typescript
const [showLoginModal, setShowLoginModal] = useState(false);
```

**Components Used:**
- `TeacherLoginModal`

---

#### `NotFound.tsx` - 404 Page

**Route:** `*` (catch-all)  
**Auth:** Public  
**Purpose:** Handle invalid routes

**Key Features:**
- 404 message
- Links back to home or dashboard

---

### Teacher Pages

#### `TeacherDashboard.tsx` - Quiz Management

**Route:** `/teacher/dashboard`  
**Auth:** Protected (teacher only)  
**Purpose:** Main teacher interface for managing quizzes

**Key Features:**
- List all available quizzes
- Create room from quiz
- Delete quiz
- Upload new quiz JSON
- View quiz history
- Create custom quiz

**State:**
```typescript
const [quizzes, setQuizzes] = useState<SimpleQuiz[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [deleteModal, setDeleteModal] = useState({
  show: boolean,
  quiz: { id: string, name: string } | null
});
```

**API Calls:**
```typescript
// GET /api/quizzes - Load all quizzes
const loadQuizzes = async () => {
  const response = await fetch('/api/quizzes');
  const data = await response.json();
  setQuizzes(data);
};

// DELETE /api/quiz/:quizId - Delete quiz
const handleDeleteQuiz = async (quizId: string) => {
  const response = await fetch(`/api/quiz/${quizId}`, {
    method: 'DELETE'
  });
};
```

**Socket Events:**
```typescript
// Create room
socket.emit('create_room', { quizId, teacherId });

// Listen for room created
socket.on('room_created', (data) => {
  navigate(`/teacher/room/${data.roomId}/waiting`);
});
```

**Navigation Flow:**
```
Dashboard → Create Room → Waiting Room → Quiz Room → History
         ↘ Create Quiz → Dashboard
         ↘ View History → History Detail
```

---

#### `TeacherWaitingRoom.tsx` - Pre-Quiz Lobby

**Route:** `/teacher/room/:roomId/waiting`  
**Auth:** Protected  
**Purpose:** Wait for students to join before starting quiz

**Key Features:**
- Display room code (6 digits)
- Show QR code for easy joining
- Real-time player list
- Start quiz button
- Delete room option

**State:**
```typescript
const [roomId, setRoomId] = useState<string>('');
const [players, setPlayers] = useState<PlayerInfo[]>([]);
const [quizName, setQuizName] = useState<string>('');
const [canStart, setCanStart] = useState(false);
```

**Socket Events:**
```typescript
// Join room as teacher
socket.emit('join_teacher_room', { roomId });

// Listen for players joining
socket.on('player_joined', (data) => {
  setPlayers(data.players);
});

// Start quiz
socket.emit('start_quiz', { roomId });

// Navigate on quiz started
socket.on('quiz_started', () => {
  navigate(`/teacher/room/${roomId}/question/${firstQuestionId}`);
});
```

**Components Used:**
- `Layout`
- `QRCode` (from qrcode.react)

---

#### `TeacherQuizRoom.tsx` - Quiz Control

**Route:** Multiple (question, result, final)  
**Auth:** Protected  
**Purpose:** Control quiz flow, see student progress

**Key Features:**
- Display current question (with correct answer highlighted)
- Show answer counts in real-time
- Timer display
- Next question button
- End quiz button
- Progress bar
- Final rankings view

**State:**
```typescript
const [currentQuestion, setCurrentQuestion] = useState<any>(null);
const [answeredCount, setAnsweredCount] = useState(0);
const [totalPlayers, setTotalPlayers] = useState(0);
const [remainingTime, setRemainingTime] = useState(0);
const [rankings, setRankings] = useState<PlayerRanking[]>([]);
const [quizEnded, setQuizEnded] = useState(false);
```

**Socket Events:**
```typescript
// Receive new question
socket.on('new_question', (data) => {
  setCurrentQuestion(data);
  setRemainingTime(data.timeLimit);
});

// Update answer count
socket.on('answer_update', (data) => {
  setAnsweredCount(data.answeredCount);
  setTotalPlayers(data.totalPlayers);
});

// Next question
socket.emit('next_question', roomId);

// Quiz ended
socket.on('quiz_ended', (data) => {
  setQuizEnded(true);
  setRankings(data.rankings);
  navigate(`/teacher/room/${roomId}/final`);
});
```

**URL Params:**
- `:roomId` - Current room identifier
- `:questionId` - Current question index

**View States:**
1. **Question View** - `/question/:questionId` - Active question
2. **Result View** - `/result/:questionId` - Question results
3. **Final View** - `/final` - Final rankings

---

#### `TeacherCreateQuiz.tsx` - Create Custom Quiz

**Route:** `/teacher/create-quiz`  
**Auth:** Protected  
**Purpose:** Upload new quiz JSON file

**Key Features:**
- File upload (JSON only)
- JSON validation
- Preview quiz structure
- Save quiz
- Download template

**State:**
```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [quizData, setQuizData] = useState<any>(null);
const [error, setError] = useState<string>('');
const [success, setSuccess] = useState<string>('');
```

**API Calls:**
```typescript
// POST /api/quiz - Create new quiz
const handleCreateQuiz = async () => {
  const response = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizData)
  });
};

// GET /api/quiz/template - Download template
const downloadTemplate = async () => {
  window.location.href = '/api/quiz/template';
};
```

---

#### `TeacherQuizHistory.tsx` - Past Quizzes

**Route:** `/teacher/history`  
**Auth:** Protected  
**Purpose:** View all past quiz sessions

**Key Features:**
- List of completed quizzes
- Date, time, participants
- Winner information
- View details link
- Search/filter
- Pagination

**State:**
```typescript
const [history, setHistory] = useState<QuizHistory[]>([]);
const [loading, setLoading] = useState(true);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
```

**API Calls:**
```typescript
// GET /api/history - Get all history
const loadHistory = async () => {
  const response = await fetch('/api/history');
  const data = await response.json();
  setHistory(data);
};
```

---

#### `TeacherQuizHistoryDetail.tsx` - Quiz Results Detail

**Route:** `/teacher/history/:roomId`  
**Auth:** Protected  
**Purpose:** Detailed view of a past quiz session

**Key Features:**
- Quiz metadata (date, name, duration)
- Complete rankings
- Individual student performance
- Question-by-question breakdown
- Export options

**State:**
```typescript
const [historyData, setHistoryData] = useState<DetailedHistory | null>(null);
const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
```

**API Calls:**
```typescript
// GET /api/history/:roomId - Get specific quiz history
const loadHistory = async (roomId: string) => {
  const response = await fetch(`/api/history/${roomId}`);
  const data = await response.json();
  setHistoryData(data);
};
```

---

### Student Pages

#### `StudentJoin.tsx` - Join Room

**Route:** `/student/join` or `/student/join/:roomId`  
**Auth:** Public  
**Purpose:** Enter room code and player info

**Key Features:**
- Input player name
- Input student ID
- Input/pre-filled room code
- Join room button
- Error handling

**State:**
```typescript
const [playerName, setPlayerName] = useState('');
const [studentId, setStudentId] = useState('');
const [roomId, setRoomId] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
```

**Socket Events:**
```typescript
// Join room
socket.emit('join_room', {
  roomId,
  playerName,
  studentId
});

// Successfully joined
socket.on('joined_room', (data) => {
  localStorage.setItem('studentSession', JSON.stringify({
    playerName,
    studentId,
    roomId: data.roomId
  }));
  
  navigate(`/student/room/${data.roomId}/waiting`);
});

// Error joining
socket.on('join_error', (error) => {
  setError(error);
  setIsLoading(false);
});
```

**Validation:**
```typescript
const validateForm = () => {
  if (!playerName.trim()) return 'Player name is required';
  if (!studentId.trim()) return 'Student ID is required';
  if (!/^\d{6}$/.test(roomId)) return 'Room code must be 6 digits';
  return null;
};
```

---

#### `StudentWaitingRoom.tsx` - Lobby

**Route:** `/student/room/:roomId/waiting`  
**Auth:** Public (but must have joined)  
**Purpose:** Wait for teacher to start quiz

**Key Features:**
- Display room code
- Show other players
- Real-time player updates
- Waiting message
- Auto-navigate on quiz start

**State:**
```typescript
const [roomId, setRoomId] = useState('');
const [playerName, setPlayerName] = useState('');
const [players, setPlayers] = useState<PlayerInfo[]>([]);
const [quizName, setQuizName] = useState('');
```

**Socket Events:**
```typescript
// Listen for players joining/leaving
socket.on('player_joined', (data) => {
  setPlayers(data.players);
});

socket.on('player_left', (data) => {
  setPlayers(prev => prev.filter(p => p.id !== data.playerId));
});

// Quiz started - navigate to first question
socket.on('quiz_started', () => {
  // Navigation handled by new_question event
});

socket.on('new_question', (data) => {
  navigate(`/student/room/${roomId}/question/${data.questionId}`);
});
```

---

#### `StudentQuizRoom.tsx` - Quiz Participation

**Route:** Multiple (question, submit, result, final)  
**Auth:** Public (must have joined)  
**Purpose:** Answer questions and see results

**Key Features:**
- Display question and options
- Timer countdown
- Submit answer
- See if answer was correct
- View current score and streak
- See rankings after each question
- Final rankings view

**State:**
```typescript
const [question, setQuestion] = useState<string>('');
const [options, setOptions] = useState<string[]>([]);
const [selectedOption, setSelectedOption] = useState<number | null>(null);
const [hasAnswered, setHasAnswered] = useState(false);
const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
const [remainingTime, setRemainingTime] = useState(0);
const [currentScore, setCurrentScore] = useState(0);
const [streak, setStreak] = useState(0);
const [rankings, setRankings] = useState<PlayerRanking[]>([]);
const [quizEnded, setQuizEnded] = useState(false);
```

**Socket Events:**
```typescript
// Receive new question
socket.on('new_question', (data) => {
  setQuestion(data.question);
  setOptions(data.options);
  setRemainingTime(data.timeLimit);
  setHasAnswered(false);
  setSelectedOption(null);
  
  navigate(`/student/room/${roomId}/question/${data.questionId}`);
});

// Submit answer
const handleSubmit = () => {
  socket.emit('submit_answer', {
    roomId,
    questionId,
    selectedOption,
    timeTaken
  });
  setHasAnswered(true);
};

// Answer result
socket.on('answer_submitted', (data) => {
  setIsCorrect(data.isCorrect);
  setCorrectAnswer(data.correctAnswer);
  setCurrentScore(data.newScore);
  setStreak(data.streak);
});

// Question result
socket.on('question_result', (data) => {
  setCorrectAnswer(data.correctAnswer);
  setRankings(data.rankings);
  navigate(`/student/room/${roomId}/result/${questionId}`);
});

// Quiz ended
socket.on('quiz_ended', (data) => {
  setQuizEnded(true);
  setRankings(data.rankings);
  navigate(`/student/room/${roomId}/final`);
});
```

**URL Params:**
- `:roomId` - Current room identifier
- `:questionId` - Current question index

**View States:**
1. **Question View** - `/question/:questionId` - Active question
2. **Submit View** - `/submit/:questionId` - Waiting for others
3. **Result View** - `/result/:questionId` - Question results
4. **Final View** - `/final` - Final rankings

---

## 🏗️ Standard Page Pattern

### Basic Structure

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';

interface PageProps {
  // Define any props if needed
}

const PageName = () => {
  // 1. Hooks
  const { paramName } = useParams<{ paramName: string }>();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { isAuthenticated, teacherId } = useAuth();

  // 2. Local state
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // 3. Effects for API calls
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/endpoint');
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 4. Effects for Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleEvent = (data: any) => {
      // Handle event
    };

    socket.on('event_name', handleEvent);

    return () => {
      socket.off('event_name', handleEvent);
    };
  }, [socket]);

  // 5. Event handlers
  const handleAction = () => {
    // Handle user action
  };

  // 6. Loading/error states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  // 7. Render
  return (
    <Layout>
      <div className="container mx-auto">
        {/* Page content */}
      </div>
    </Layout>
  );
};

export default PageName;
```

---

## 🔄 Common Patterns

### URL Parameters

```typescript
import { useParams } from 'react-router-dom';

const { roomId, questionId } = useParams<{ 
  roomId: string; 
  questionId: string;
}>();
```

### Navigation

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to route
navigate('/teacher/dashboard');

// Navigate with replace (no history)
navigate('/student/join', { replace: true });

// Go back
navigate(-1);
```

### Protected Routes

```typescript
// In App.tsx
<Route path="/teacher/dashboard" element={
  <ProtectedRoute>
    <TeacherDashboard />
  </ProtectedRoute>
} />
```

### Session Persistence

```typescript
// Save student session
localStorage.setItem('studentSession', JSON.stringify({
  playerName,
  studentId,
  roomId
}));

// Restore session
const session = JSON.parse(localStorage.getItem('studentSession') || '{}');
```

---

## ✅ Best Practices

### ✅ DO:

```typescript
// Clean up Socket.IO listeners
useEffect(() => {
  if (!socket) return;

  const handler = (data) => { ... };
  socket.on('event', handler);

  return () => {
    socket.off('event', handler);
  };
}, [socket]);

// Handle loading states
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;

// Validate input before API/socket calls
if (!roomId || !/^\d{6}$/.test(roomId)) {
  setError('Invalid room code');
  return;
}

// Use Layout component for consistent structure
return (
  <Layout>
    {/* Page content */}
  </Layout>
);
```

### ❌ DON'T:

```typescript
// Don't forget to clean up
useEffect(() => {
  socket.on('event', handler);
  // ❌ Missing cleanup!
}, [socket]);

// Don't ignore loading/error states
return (
  <div>
    {data.map(...)} {/* ❌ What if data is null? */}
  </div>
);

// Don't skip validation
socket.emit('join_room', { roomId }); // ❌ What if roomId is invalid?
```

---

## 📋 Checklist for New Page

- [ ] Create `.tsx` file in `pages/` folder
- [ ] Import necessary hooks (useState, useEffect, useParams, etc.)
- [ ] Import custom hooks (useSocket, useAuth if needed)
- [ ] Define TypeScript interfaces for data
- [ ] Implement loading and error states
- [ ] Add Socket.IO event listeners with cleanup
- [ ] Validate user input
- [ ] Handle navigation properly
- [ ] Use Layout component
- [ ] Add route to App.tsx
- [ ] Protect route if teacher-only
- [ ] Test all user flows
- [ ] Update this README

---

## 📚 Related Documentation

- **Components:** [../components/README.md](../components/README.md)
- **Hooks:** [../hooks/README.md](../hooks/README.md)
- **Socket Events:** [../../api/src/socket/handlers/README.md](../../api/src/socket/handlers/README.md)
- **API Endpoints:** [../../api/README.md](../../api/README.md)
- **Routing:** [React Router Documentation](https://reactrouter.com/)

---

**Last Updated:** October 5, 2025  
**Total Pages:** 11 (1 landing, 1 error, 6 teacher, 3 student)
