import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import HomePage from './pages/HomePage.tsx';
import NotFound from './pages/NotFound.tsx';
import TeacherDashboard from './pages/TeacherDashboard.tsx';
import TeacherWaitingRoom from './pages/TeacherWaitingRoom.tsx';
import StudentJoin from './pages/StudentJoin.tsx';
import StudentWaitingRoom from './pages/StudentWaitingRoom.tsx';
import StudentQuizRoom from './pages/StudentQuizRoom.tsx';
import TeacherQuizRoom from './pages/TeacherQuizRoom.tsx';
import TeacherCreateQuiz from './pages/TeacherCreateQuiz.js';
import './styles.css'; // Use original styles
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
              
              {/* Teacher Routes - Protected */}
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
              
              {/* Student Routes - Public */}
              <Route path="/student/join" element={<StudentJoin />} />
              <Route path="/student/join/:roomId" element={<StudentJoin />} />
              <Route path="/student/room/:roomId/waiting" element={<StudentWaitingRoom />} />
              <Route path="/student/room/:roomId/question/:questionId" element={<StudentQuizRoom />} />
              <Route path="/student/room/:roomId/submit/:questionId" element={<StudentQuizRoom />} />
              <Route path="/student/room/:roomId/result/:questionId" element={<StudentQuizRoom />} />
              
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
