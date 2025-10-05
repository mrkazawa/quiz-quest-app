# Quiz Quest

A real-time multiple choice quiz application similar to Kahoot, built with **React TypeScript** and **Node.js TypeScript**. This application allows teachers to create quiz rooms and enables students to join and participate in real-time with modern URL routing, session management, and detailed analytics.

**🚀 Modern Stack:** React 19 + TypeScript + Vite + Node.js + TypeScript + Socket.IO + Bootstrap 5

## Features

### 🎓 **Teacher Features**

- **Password-protected teacher login** with customizable authentication
- **Quiz room creation** from predefined question sets with 6-digit room codes
- **Real-time student monitoring** in waiting rooms with QR code sharing
- **Live quiz management** with question progression and timer controls
- **Comprehensive quiz history** with detailed session analytics
- **Advanced CSV export** with question-by-question student performance data
- **Session persistence** - teachers can rejoin rooms after browser refresh
- **Modern URL routing** for deep linking to specific quiz states (`/teacher/room/123456/question/1`)
- **Real-time player disconnect/reconnect handling**

### 👨‍🎓 **Student Features**

- **Simple join process** with name, student ID, and room code
- **Real-time quiz participation** with visual timer and score tracking
- **Live streak tracking** and score updates during gameplay
- **Session persistence** - students can rejoin after disconnection during active quizzes
- **Mobile-friendly interface** with responsive design
- **QR code support** for easy room joining on mobile devices
- **Real-time leaderboard updates** during quiz sessions
- **Automatic reconnection** support with state restoration
- **Modern URL routing** for bookmarkable quiz states (`/student/room/123456/question/1`)

### 🏆 **Quiz Management**

- **Dynamic scoring system** based on speed and accuracy with streak multipliers
- **Configurable question sets** with metadata support (name, description)
- **Real-time leaderboards** and comprehensive final rankings
- **Question-by-question result analysis** for teachers
- **Automatic session cleanup** and room management
- **Timer synchronization** across all participants
- **Graceful quiz ending** with detailed result compilation

### 📊 **Analytics & Reporting**

- **Detailed quiz history** with date/time stamps and participant counts
- **Enhanced CSV exports** including:
  - Student rankings and final scores sorted by student ID
  - Question-by-question answer choices with option text
  - Time taken and correctness for each question
  - Streak progression throughout the quiz
  - Running score totals after each question
- **Real-time result displays** during and after quizzes
- **Historical data access** through quiz history interface

### 🔧 **Technical Features**

- **Hash-based routing** for direct linking and session restoration
- **Real-time WebSocket communication** with Socket.IO
- **Persistent session management** using localStorage for teacher identification
- **Docker containerization** with environment configuration
- **Serveo tunnel integration** for easy public access without port forwarding
- **Graceful disconnection handling** and automatic reconnection support
- **Client-side teacher persistence** across browser refreshes

## Project Structure

```shell
quiz-quest/
├── api/                     # Server-side TypeScript code
│   ├── src/
│   │   ├── server.ts       # Main Express server entry point
│   │   ├── app.ts          # Express application configuration
│   │   ├── types/          # TypeScript type definitions
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic layer
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Custom middleware
│   │   ├── socket/         # Socket.IO configuration
│   │   └── utils/          # Utility functions
│   ├── dist/               # Compiled JavaScript output
│   ├── tsconfig.json       # TypeScript configuration
│   ├── package.json        # API dependencies and scripts
│   └── README.md           # API documentation
├── client/                 # React TypeScript implementation
│   ├── index.html          # Main React app entry point
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.ts      # Vite configuration
│   ├── src/                # React source code
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript type definitions
│   └── dist/               # Built production files
├── app/                     # Legacy client-side code (backup)
│   ├── index.html          # Main landing page
│   ├── teacher.html        # Teacher interface
│   ├── student.html        # Student interface
│   ├── styles.css          # Global styling
│   ├── teacher.js          # Teacher client-side logic
│   ├── student.js          # Student client-side logic
│   ├── utils.js            # Shared utility functions
│   ├── qrcode.min.js       # QR code generation library
│   ├── quiz-quest-logo.png # Application logo
│   └── README.md           # Client documentation
├── questions/               # Quiz question sets directory
│   ├── general-knowledge.json
│   ├── science.json
│   └── ... (more quiz files)
├── docs/                   # Documentation
│   ├── SETUP.md
│   ├── USER_GUIDE.md
│   └── template-quiz.json
├── package.json            # Root package management
├── Dockerfile             # Docker containerization
└── docker-compose.yml     # Docker deployment configuration
```

### Key Components

- **API Layer** (`api/`): Express.js + TypeScript with Socket.IO for real-time communication
- **Client Layer** (`client/`): React 19 + TypeScript with hash-based routing
- **Legacy Client** (`app/`): Vanilla JavaScript implementation (kept for reference)
- **Data Storage**: In-memory session management with persistent quiz history
- **Question Management**: JSON-based quiz definitions with metadata support
- **Authentication**: Session-based teacher authentication with configurable passwords
- **Deployment**: Docker containerization with Serveo tunnel integration

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Docker (optional, for containerized deployment)

## Quick Start

### Local Development

```bash
# Clone and install
git clone <repository-url>
cd quiz-quest-app

# Option 1: Use deploy script (recommended)
./deploy.sh

# Option 2: Manual installation
npm run install:all

# Start the application
npm start

# For development with auto-restart
npm run dev
```

### Docker Deployment

```bash
# Build and run
docker-compose up --build

# Check logs for Serveo public URL
docker-compose logs app
```

The application will be available at `http://localhost:3000` or via the generated Serveo public URL.

## Configuration

Environment variables can be configured via `.env` file or docker-compose:

```env
TEACHER_PASSWORD=your_secure_password    # Default: quizmaster123
SESSION_SECRET=your_session_secret       # For session security
NODE_ENV=production                     # Environment mode
```

## Documentation

### 📚 For Users
- **[User Guide](docs/USER_GUIDE.md)** - Complete guide for teachers and students
- **[Setup Guide](docs/SETUP.md)** - Installation and configuration

### 🚀 For Deployment
- **[Deployment Guide](docs/DEPLOYMENT.md)** - All deployment scenarios (Docker, IP, Domain, Tunneling)

### 💻 For Developers
- **[Development Guide](docs/DEVELOPMENT.md)** - Architecture, testing, best practices
- **[API Documentation](api/README.md)** - REST API and Socket.IO reference
- **[Test Documentation](api/tests/README.md)** - Testing guide

### 🐳 For Docker
- **[Docker Guide](docker/README.md)** - Container deployment options
