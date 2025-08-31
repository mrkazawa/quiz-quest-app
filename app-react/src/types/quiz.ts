// Quiz related types
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  points: number;
}

export interface QuizSet {
  id: string; // The quiz identifier used for room creation
  name: string;
  description?: string;
  questions: Question[];
  questionCount: number; // Computed property for display
}

export interface Player {
  socketId: string;
  studentId: string;
  name: string;
  score: number;
  streak: number;
  answers: Answer[];
}

export interface Answer {
  questionId: number;
  answerId: number | null;
  isCorrect: boolean;
  timeTaken: number;
}

export interface Room {
  roomId: string;
  quizId: string;
  players: Record<string, Player>;
  isActive: boolean;
  currentQuestionIndex: number;
  hostId: string;
  teacherSessionId: string;
  createdAt: number;
}

export interface QuestionResults {
  questionId: number;
  correctAnswer: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  playerAnswers: PlayerAnswer[];
}

export interface PlayerAnswer {
  playerId: string;
  playerName: string;
  studentId: string;
  answerId: number | null;
  isCorrect: boolean;
  score: number;
  streak: number;
}

export interface QuizHistory {
  id: string;
  roomId: string;
  quizId: string;
  quizName: string;
  dateCompleted: string;
  playerCount: number;
  rankings: Ranking[];
  detailedResults: DetailedResult[];
}

export interface Ranking {
  rank: number;
  playerId: string;
  playerName: string;
  studentId: string;
  score: number;
}

export interface DetailedResult {
  studentId: string;
  playerName: string;
  finalScore: number;
  answers: ProcessedAnswer[];
}

export interface ProcessedAnswer {
  questionId: number;
  answerId: number | null;
  answerText: string;
  isCorrect: boolean;
  timeTaken: number;
  streakAfter: number;
  scoreAfter: number;
}
