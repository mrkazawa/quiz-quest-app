# Quiz Quest Client

React 19 + TypeScript + Vite frontend for Quiz Quest real-time quiz application.

---

## Quick Start

```bash
# Install dependencies
npm install

# Development server (with HMR)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Project Structure

```
client/
├── src/
│   ├── main.tsx            # Entry point
│   ├── App.tsx             # Root component with routing
│   ├── components/         # Reusable UI components
│   │   ├── Layout/         # Layout components (Header, Footer)
│   │   ├── Teacher/        # Teacher-specific components
│   │   └── Student/        # Student-specific components
│   ├── pages/              # Page components (routes)
│   │   ├── HomePage.tsx
│   │   ├── TeacherLoginPage.tsx
│   │   ├── StudentJoinPage.tsx
│   │   ├── TeacherWaitingRoomPage.tsx
│   │   ├── StudentWaitingRoomPage.tsx
│   │   ├── TeacherQuizPage.tsx
│   │   ├── StudentQuizPage.tsx
│   │   ├── ResultsPage.tsx
│   │   ├── QuizManagementPage.tsx
│   │   └── QuizHistoryPage.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useSocket.ts    # Socket.IO connection hook
│   │   └── ...             # Other custom hooks
│   ├── context/            # React context providers
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── ...             # Other contexts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Shared types
│   ├── assets/             # Images, icons, etc.
│   └── styles.css          # Global styles (Tailwind)
├── public/                 # Static assets
│   ├── favicon.ico
│   └── quiz-quest-logo.png
├── dist/                   # Build output (generated)
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.app.json       # App-specific TS config
├── tsconfig.node.json      # Node-specific TS config
├── eslint.config.js        # ESLint configuration
└── package.json            # Dependencies and scripts
```

---

## Tech Stack

- **Framework:** React 19.1+ with functional components and hooks
- **Language:** TypeScript 5.6+
- **Build Tool:** Vite 7.1+ (fast HMR, optimized production builds)
- **Routing:** React Router 7.1+ (hash routing for session persistence)
- **Styling:** Tailwind CSS 4.1+ (utility-first CSS)
- **Real-time:** Socket.IO Client 4.8+ (WebSocket communication)
- **HTTP Client:** Built-in fetch API
- **QR Codes:** qrcode.react (for room codes)
- **Icons:** Bootstrap Icons
- **Linting:** ESLint 9+ with TypeScript and React plugins

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server at http://localhost:5173 |
| `npm run build` | Build for production (TypeScript check + Vite build) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

---

## Development

### Hot Module Replacement (HMR)

Vite provides instant HMR for:
- React components (preserves state)
- CSS/Tailwind classes
- TypeScript files

### Environment Variables

Create `.env` file for development:
```bash
# API Base URL (optional, defaults to same origin)
VITE_API_URL=http://localhost:3000
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL || '';
```

---

## Routes

### Public Routes
- `/` - Home page
- `/teacher/login` - Teacher login
- `/student/join` - Student join page

### Teacher Routes (Auth Required)
- `/teacher/waiting/:roomId` - Waiting room for quiz
- `/teacher/quiz/:roomId` - Active quiz control page
- `/teacher/results/:roomId` - Quiz results
- `/teacher/quizzes` - Quiz management
- `/teacher/history` - Quiz history

### Student Routes
- `/student/waiting/:roomId` - Waiting room for quiz
- `/student/quiz/:roomId` - Active quiz participation
- `/student/results/:roomId` - Personal results

---

## Components

### Layout Components
- **Header** - Navigation bar with role-specific menu
- **Footer** - App footer with version info

### Teacher Components
- **TeacherDashboard** - Quiz management interface
- **WaitingRoom** - Pre-quiz lobby with QR code
- **QuizControl** - Quiz question navigation and control
- **ResultsDisplay** - Final rankings and statistics
- **HistoryList** - Past quiz sessions

### Student Components
- **JoinForm** - Room code entry
- **WaitingRoom** - Pre-quiz lobby
- **QuizQuestion** - Question display and answer submission
- **Results** - Personal performance and ranking

---

## Socket.IO Integration

### Connection Hook

```typescript
// Custom hook for Socket.IO
const socket = useSocket('http://localhost:3000');

// Listen for events
useEffect(() => {
  socket.on('gameStarted', (data) => {
    // Handle game start
  });

  return () => {
    socket.off('gameStarted');
  };
}, [socket]);

// Emit events
socket.emit('joinRoom', { roomId, username, studentId });
```

### Events Handled

**Student Events:**
- `roomJoined` - Confirmed room join
- `gameStarted` - Quiz started
- `nextQuestion` - New question
- `questionResult` - Question results
- `gameEnded` - Quiz ended
- `playerJoined` / `playerLeft` - Player updates

**Teacher Events:**
- `teacherJoined` - Teacher session established
- `playerJoined` / `playerLeft` - Player updates
- `gameStateUpdate` - Game state changes

---

## Styling with Tailwind CSS

### Utility-First Approach

```tsx
<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Click Me
</button>
```

### Custom Configuration

Tailwind config in `tailwind.config.js`:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        // ... custom colors
      },
    },
  },
  plugins: [],
};
```

### Global Styles

Custom styles in `src/styles.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component classes */
@layer components {
  .btn-primary {
    @apply bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded;
  }
}
```

---

## TypeScript Configuration

### Strict Mode Enabled

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Type Definitions

```typescript
// src/types/index.ts
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  points: number;
}

export interface Quiz {
  id: string;
  setName: string;
  setDescription: string;
  questionCount: number;
}

export interface Player {
  id: string;
  username: string;
  studentId: string;
  score: number;
  streak: number;
}
```

---

## Building for Production

### Build Command

```bash
npm run build
```

**Output:** `dist/` folder with:
- Minified and bundled JavaScript
- Optimized CSS
- HTML with proper asset links
- Source maps (for debugging)

### Build Stats

```
dist/
├── index.html              (~0.66 KB)
├── assets/
│   ├── index-[hash].css    (~30 KB gzipped)
│   └── index-[hash].js     (~113 KB gzipped)
└── images/                 (optimized assets)
```

### Preview Build

```bash
npm run preview
# Opens at http://localhost:4173
```

---

## Code Quality

### ESLint Configuration

Configured with:
- TypeScript ESLint plugin
- React ESLint plugin
- React Hooks rules
- React Refresh plugin

Run linting:
```bash
npm run lint
```

### TypeScript Type Checking

```bash
# Type check during build
npm run build

# Watch mode (separate terminal)
tsc --watch --noEmit
```

---

## Best Practices

### Component Structure

```typescript
import { useState, useEffect } from 'react';
import type { Props } from './types';

export function MyComponent({ prop1, prop2 }: Props) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  return (
    <div className="container mx-auto">
      {/* JSX */}
    </div>
  );
}
```

### State Management

- **Local State:** `useState` for component-specific state
- **Context:** For shared state (auth, theme, etc.)
- **Socket State:** Real-time data from server

### Performance Optimization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
export const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* ... */}</div>;
});

// Memoize expensive computations
const result = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies]);
```

---

## Deployment

### Static Hosting

Build and deploy `dist/` folder to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

### Environment Configuration

For production, configure API URL:
```bash
# Build with production API URL
VITE_API_URL=https://api.yourdomain.com npm run build
```

---

## Additional Documentation

- **Main README:** [../README.md](../README.md)
- **User Guide:** [../docs/USER_GUIDE.md](../docs/USER_GUIDE.md)
- **Deployment Guide:** [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)
- **Development Guide:** [../docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)
- **API Documentation:** [../api/README.md](../api/README.md)

---

## Features

✅ React 19 with latest features  
✅ TypeScript strict mode  
✅ Vite for fast development and optimized builds  
✅ Tailwind CSS for modern styling  
✅ React Router for navigation  
✅ Socket.IO for real-time updates  
✅ QR code generation  
✅ Responsive design (mobile-friendly)  
✅ ESLint for code quality  
✅ Production-ready builds  

---

**Status:** Production Ready 🚀
