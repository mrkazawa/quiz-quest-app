import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import HomePage from './pages/HomePage.tsx';
import TeacherLogin from './pages/TeacherLogin.tsx';
import TeacherDashboard from './pages/TeacherDashboard.tsx';
import TeacherWaitingRoom from './pages/TeacherWaitingRoom.tsx';
import StudentJoin from './pages/StudentJoin.tsx';
import StudentWaitingRoom from './pages/StudentWaitingRoom.tsx';
import StudentQuizRoomNew from './pages/StudentQuizRoomNew.tsx';
import TeacherQuizRoom from './pages/TeacherQuizRoom.tsx';
import './styles.css'; // Use original styles
import './styles/quiz-quest.css'; // Quiz Quest specific styles
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              
              {/* Teacher Routes */}
              <Route path="/teacher/login" element={<TeacherLogin />} />
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/room/:roomId/waiting" element={<TeacherWaitingRoom />} />
              <Route path="/teacher/room/:roomId/question/:questionId" element={<TeacherQuizRoom />} />
              <Route path="/teacher/room/:roomId/result/:questionId" element={<TeacherQuizRoom />} />
              <Route path="/teacher/room/:roomId/final" element={<TeacherQuizRoom />} />
              
              {/* Student Routes */}
              <Route path="/student/join" element={<StudentJoin />} />
              <Route path="/student/join/:roomId" element={<StudentJoin />} />
              <Route path="/student/room/:roomId/waiting" element={<StudentWaitingRoom />} />
              <Route path="/student/room/:roomId/question/:questionId" element={<StudentQuizRoomNew />} />
              <Route path="/student/room/:roomId/submit/:questionId" element={<StudentQuizRoomNew />} />
              <Route path="/student/room/:roomId/result/:questionId" element={<StudentQuizRoomNew />} />
              <Route path="/student/room/:roomId/final" element={<StudentQuizRoomNew />} />
            </Routes>
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
