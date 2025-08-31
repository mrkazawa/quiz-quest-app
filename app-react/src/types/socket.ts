import type { QuestionResults } from './quiz.ts';

// Student info for room management
export interface StudentInfo {
  socketId: string;
  studentId: string;
  name: string;
  joinedAt: number;
}

// Player summary for socket events
export interface PlayerSummary {
  id: string;
  name: string;
  studentId: string;
  score: number;
}

// Socket.IO event types
export interface ServerToClientEvents {
  room_created: (data: { roomId: string; quizId: string }) => void;
  room_error: (message: string) => void;
  room_info: (data: { roomId: string; quizName: string; students: StudentInfo[] }) => void;
  student_joined: (data: { socketId: string; studentId: string; name: string; joinedAt: number }) => void;
  student_left: (data: { socketId: string }) => void;
  room_deleted: () => void;
  joined_room: (data: { roomId: string; questionId?: number; isActive: boolean }) => void;
  join_error: (message: string) => void;
  player_joined: (data: { playerId: string; playerName: string; studentId: string; players: PlayerSummary[] }) => void;
  player_left: (data: { playerId: string; players: PlayerSummary[] }) => void;
  player_disconnected: (data: { playerId: string; studentId: string; playerName: string }) => void;
  quiz_started: (data: { roomId: string }) => void;
  new_question: (data: NewQuestionData) => void;
  question_ended: (data: QuestionResults) => void;
  quiz_ended: (data: { message?: string; historyId?: string }) => void;
  answer_result: (data: { isCorrect: boolean; pointsEarned: number; streak: number; totalScore: number }) => void;
  answer_error: (message: string) => void;
  teacher_joined_room: (data: TeacherJoinedRoomData) => void;
  teacher_joined_completed_room: (data: { roomId: string; isCompleted: boolean; historyId: string }) => void;
}

export interface ClientToServerEvents {
  create_room: (data: { quizId: string; teacherId: string }) => void;
  join_room: (data: { roomId: string; playerName: string; studentId: string }) => void;
  leave_room: (roomId: string, deleteRoom?: boolean) => void;
  join_teacher_room: (data: { roomId: string; teacherId: string }) => void;
  get_room_info: (data: { roomId: string }) => void;
  delete_room: (data: { roomId: string }) => void;
  start_quiz: (data: { roomId: string }) => void;
  submit_answer: (data: { roomId: string; answerId: number }) => void;
  next_question: (roomId: string) => void;
}

export interface NewQuestionData {
  question: string;
  options: string[];
  timeLimit: number;
  remainingTime: number;
  questionId: number;
  currentScore?: number;
  currentStreak?: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  hasAnswered?: boolean;
  questionExpired?: boolean;
}

export interface TeacherJoinedRoomData {
  roomId: string;
  isActive: boolean;
  players: Array<{
    id: string;
    name: string;
    studentId: string;
    score: number;
  }>;
}
