export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  points: number;
}

export interface QuizData {
  setName: string;
  setDescription: string;
  roomId?: string;
  questions: Question[];
}

export interface Quiz {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
  createdAt?: string;
}

export interface QuizSummary {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

export interface CreateQuizResult {
  quizId: string;
  message: string;
}

export interface DeleteQuizResult {
  message: string;
}
