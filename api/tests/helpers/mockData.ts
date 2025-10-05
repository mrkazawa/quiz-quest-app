import { Question, QuizData, Quiz } from '../../src/types/quiz';

/**
 * Mock question data for testing
 */
export const mockQuestion1: Question = {
  id: 1,
  question: 'What is the capital of France?',
  options: ['London', 'Berlin', 'Paris', 'Madrid'],
  correctAnswer: 2,
  timeLimit: 30,
  points: 100,
};

export const mockQuestion2: Question = {
  id: 2,
  question: 'What is 2 + 2?',
  options: ['3', '4', '5', '6'],
  correctAnswer: 1,
  timeLimit: 15,
  points: 50,
};

export const mockQuestion3: Question = {
  id: 3,
  question: 'Which planet is known as the Red Planet?',
  options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
  correctAnswer: 1,
  timeLimit: 20,
  points: 75,
};

/**
 * Mock quiz data for testing
 */
export const mockQuizData: QuizData = {
  setName: 'Test Quiz',
  setDescription: 'A test quiz for unit testing',
  questions: [mockQuestion1, mockQuestion2, mockQuestion3],
};

export const mockQuiz: Quiz = {
  id: 'test-quiz',
  name: 'Test Quiz',
  description: 'A test quiz for unit testing',
  questions: [mockQuestion1, mockQuestion2, mockQuestion3],
};

/**
 * Mock quiz data with single question
 */
export const mockSingleQuestionQuizData: QuizData = {
  setName: 'Single Question Quiz',
  setDescription: 'A quiz with just one question',
  questions: [mockQuestion1],
};

/**
 * Mock invalid quiz data for validation testing
 */
export const mockInvalidQuizData = {
  // Missing setName
  setDescription: 'Invalid quiz',
  questions: [mockQuestion1],
};

export const mockInvalidQuestion = {
  id: 4,
  question: 'Invalid question',
  options: ['Only', 'Three'], // Should have 4 options
  correctAnswer: 0,
  timeLimit: 10,
  points: 50,
};

/**
 * Mock player data for room testing
 */
export const mockPlayer1 = {
  socketId: 'socket-123',
  playerName: 'Alice',
  studentId: 'student-001',
};

export const mockPlayer2 = {
  socketId: 'socket-456',
  playerName: 'Bob',
  studentId: 'student-002',
};

export const mockPlayer3 = {
  socketId: 'socket-789',
  playerName: 'Charlie',
  studentId: 'student-003',
};

/**
 * Mock teacher data
 */
export const mockTeacherId = 'teacher-001';
export const mockTeacherSocketId = 'teacher-socket-123';

/**
 * Helper function to create a mock quiz with custom data
 */
export function createMockQuiz(overrides: Partial<Quiz> = {}): Quiz {
  return {
    ...mockQuiz,
    ...overrides,
  };
}

/**
 * Helper function to create a mock question with custom data
 */
export function createMockQuestion(overrides: Partial<Question> = {}): Question {
  return {
    ...mockQuestion1,
    ...overrides,
  };
}

/**
 * Helper function to create multiple mock questions
 */
export function createMockQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    question: `Question ${i + 1}?`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: i % 4,
    timeLimit: 30,
    points: 100,
  }));
}

/**
 * Helper function to create mock quiz data with custom questions
 */
export function createMockQuizData(
  questionCount: number,
  overrides: Partial<QuizData> = {}
): QuizData {
  return {
    setName: 'Test Quiz',
    setDescription: 'A test quiz',
    questions: createMockQuestions(questionCount),
    ...overrides,
  };
}
