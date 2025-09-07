import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface SocketData {
  userId?: string;
  username?: string;
  roomId?: string;
  isTeacher?: boolean;
}

export interface ServerToClientEvents {
  // Room events
  room_created: (data: { roomId: string; quizId: string }) => void;
  roomJoined: (data: { username: string; participants: string[] }) => void;
  roomLeft: (data: { username: string; participants: string[] }) => void;
  roomClosed: () => void;
  room_error: (message: string) => void;
  room_info: (data: { roomId: string; quizName: string; students: any[] }) => void;
  room_deleted: (data: { message: string }) => void;
  join_error: (message: string) => void;
  joined_room: (data: any) => void;
  
  // Player events
  player_joined: (data: any) => void;
  player_left: (data: any) => void;
  player_disconnected: (data: any) => void;
  
  // Game events
  gameStarted: (data: { question: any; questionNumber: number; totalQuestions: number }) => void;
  nextQuestion: (data: { question: any; questionNumber: number; totalQuestions: number }) => void;
  gameEnded: (data: { results: any }) => void;
  timeUp: () => void;
  quiz_started: (data: { roomId: string }) => void;
  new_question: (data: any) => void;
  question_ended: (data: any) => void;
  quiz_ended: (data: { message?: string; historyId?: string }) => void;
  start_error: (message: string) => void;
  next_error: (message: string) => void;
  
  // Answer events
  answerReceived: () => void;
  resultsUpdate: (data: { results: any }) => void;
  answer_result: (data: { isCorrect: boolean; pointsEarned: number; streak: number; totalScore: number }) => void;
  answer_error: (message: string) => void;
  submit_answer: (data: { roomId: string; answerId: number }) => void;
  
  // Teacher events
  teacher_joined_room: (data: any) => void;
  teacher_joined_completed_room: (data: { roomId: string; isCompleted: boolean; historyId: string }) => void;
  quiz_rankings: (data: any) => void;
  rankings_error: (message: string) => void;
  
  // Error events
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  // Room events
  createRoom: (data: { quizId: string; username: string }) => void;
  joinRoom: (data: { roomId: string; username: string }) => void;
  leaveRoom: () => void;
  join_room: (data: { roomId: string; playerName: string; studentId: string }) => void;
  leave_room: (roomId: string, deleteRoom?: boolean) => void;
  
  // Teacher events  
  create_room: (data: { quizId: string; teacherId: string }) => void;
  join_teacher_room: (data: { roomId: string; teacherId: string }) => void;
  get_room_info: (data: { roomId: string }) => void;
  delete_room: (data: { roomId: string }) => void;
  
  // Game events
  startGame: () => void;
  start_quiz: (data: { roomId: string }) => void;
  nextQuestion: () => void;
  next_question: (roomId: string) => void;
  get_quiz_rankings: (data: { roomId: string }) => void;
  
  // Answer events
  submitAnswer: (data: { answer: number; timeSpent: number }) => void;
  submit_answer: (data: { roomId: string; answerId: number }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
