import { QuizService } from '../../../src/services/QuizService';
import { Quiz, QuizData } from '../../../src/types/quiz';
import {
  mockQuizData,
  mockQuiz,
  mockSingleQuestionQuizData,
  createMockQuizData,
  createMockQuestion,
} from '../../helpers/mockData';

describe('QuizService', () => {
  let quizService: QuizService;

  beforeEach(() => {
    // Create a new instance for each test with autoLoad disabled
    quizService = new QuizService(undefined, false);
    quizService.clearAllQuizzes();
  });

  afterEach(() => {
    quizService.cleanup();
  });

  describe('getAllQuizzes', () => {
    it('should return empty array when no quizzes exist', () => {
      const quizzes = quizService.getAllQuizzes();
      expect(quizzes).toEqual([]);
    });

    it('should return all quizzes as summaries', () => {
      // Add some quizzes to memory
      quizService.addQuizToMemory(mockQuiz);
      quizService.addQuizToMemory({
        id: 'quiz-2',
        name: 'Second Quiz',
        description: 'Another quiz',
        questions: [createMockQuestion({ id: 10 })],
      });

      const quizzes = quizService.getAllQuizzes();

      expect(quizzes).toHaveLength(2);
      expect(quizzes[0]).toEqual({
        id: 'test-quiz',
        name: 'Test Quiz',
        description: 'A test quiz for unit testing',
        questionCount: 3,
      });
      expect(quizzes[1]).toEqual({
        id: 'quiz-2',
        name: 'Second Quiz',
        description: 'Another quiz',
        questionCount: 1,
      });
    });

    it('should use default description if not provided', () => {
      const quizWithoutDesc: Quiz = {
        id: 'no-desc',
        name: 'Quiz Without Description',
        questions: [],
      };
      quizService.addQuizToMemory(quizWithoutDesc);

      const quizzes = quizService.getAllQuizzes();

      expect(quizzes[0].description).toBe('No description available');
    });
  });

  describe('getQuizById', () => {
    beforeEach(() => {
      quizService.addQuizToMemory(mockQuiz);
    });

    it('should return quiz by ID', () => {
      const quiz = quizService.getQuizById('test-quiz');

      expect(quiz).toBeDefined();
      expect(quiz?.id).toBe('test-quiz');
      expect(quiz?.name).toBe('Test Quiz');
      expect(quiz?.questions).toHaveLength(3);
    });

    it('should return undefined for non-existent quiz', () => {
      const quiz = quizService.getQuizById('non-existent-id');

      expect(quiz).toBeUndefined();
    });

    it('should return the complete quiz object with all properties', () => {
      const quiz = quizService.getQuizById('test-quiz');

      expect(quiz).toMatchObject({
        id: 'test-quiz',
        name: 'Test Quiz',
        description: 'A test quiz for unit testing',
        questions: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            question: expect.any(String),
            options: expect.any(Array),
            correctAnswer: expect.any(Number),
            timeLimit: expect.any(Number),
            points: expect.any(Number),
          }),
        ]),
      });
    });
  });

  describe('createQuiz', () => {
    it('should create a quiz with valid data', () => {
      const result = quizService.createQuiz(mockQuizData);

      expect(result).toHaveProperty('quizId');
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('Test Quiz');
      expect(result.message).toContain('created successfully');
    });

    it('should generate a slug-based ID from quiz name', () => {
      const quizData: QuizData = {
        setName: 'My Awesome Quiz!',
        setDescription: 'Test description',
        questions: [createMockQuestion()],
      };

      const result = quizService.createQuiz(quizData);

      expect(result.quizId).toBe('my-awesome-quiz');
    });

    it('should handle special characters in quiz name', () => {
      const quizData: QuizData = {
        setName: 'Test@Quiz#2024$',
        setDescription: 'Test description',
        questions: [createMockQuestion()],
      };

      const result = quizService.createQuiz(quizData);

      expect(result.quizId).toBe('testquiz2024');
    });

    it('should generate unique IDs for quizzes with same name', () => {
      const result1 = quizService.createQuiz(mockQuizData);
      const result2 = quizService.createQuiz(mockQuizData);
      const result3 = quizService.createQuiz(mockQuizData);

      expect(result1.quizId).toBe('test-quiz');
      expect(result2.quizId).toBe('test-quiz-1');
      expect(result3.quizId).toBe('test-quiz-2');
    });

    it('should add createdAt timestamp', () => {
      const result = quizService.createQuiz(mockQuizData);
      const quiz = quizService.getQuizById(result.quizId);

      expect(quiz?.createdAt).toBeDefined();
      expect(quiz?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should store quiz in memory', () => {
      const result = quizService.createQuiz(mockQuizData);
      const quiz = quizService.getQuizById(result.quizId);

      expect(quiz).toBeDefined();
      expect(quiz?.name).toBe('Test Quiz');
      expect(quiz?.questions).toHaveLength(3);
    });
  });

  describe('deleteQuiz', () => {
    beforeEach(() => {
      quizService.addQuizToMemory(mockQuiz);
    });

    it('should delete an existing quiz', () => {
      const result = quizService.deleteQuiz('test-quiz');

      expect(result.message).toContain('Test Quiz');
      expect(result.message).toContain('deleted successfully');
    });

    it('should remove quiz from memory', () => {
      quizService.deleteQuiz('test-quiz');
      const quiz = quizService.getQuizById('test-quiz');

      expect(quiz).toBeUndefined();
    });

    it('should throw error when deleting non-existent quiz', () => {
      expect(() => {
        quizService.deleteQuiz('non-existent-id');
      }).toThrow('Quiz not found');
    });

    it('should update quiz count after deletion', () => {
      quizService.addQuizToMemory({
        id: 'quiz-2',
        name: 'Second Quiz',
        questions: [],
      });

      expect(quizService.getAllQuizzes()).toHaveLength(2);

      quizService.deleteQuiz('test-quiz');

      expect(quizService.getAllQuizzes()).toHaveLength(1);
      expect(quizService.getAllQuizzes()[0].id).toBe('quiz-2');
    });
  });

  describe('validateQuizData', () => {
    it('should validate correct quiz data', () => {
      expect(() => {
        quizService.validateQuizData(mockQuizData);
      }).not.toThrow();
    });

    it('should throw error for missing setName', () => {
      const invalidData = {
        setDescription: 'Test',
        questions: [createMockQuestion()],
      } as QuizData;

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Missing or invalid 'setName' field");
    });

    it('should throw error for invalid setName type', () => {
      const invalidData = {
        setName: 123,
        setDescription: 'Test',
        questions: [createMockQuestion()],
      } as any;

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Missing or invalid 'setName' field");
    });

    it('should throw error for missing setDescription', () => {
      const invalidData = {
        setName: 'Test',
        questions: [createMockQuestion()],
      } as QuizData;

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Missing or invalid 'setDescription' field");
    });

    it('should throw error for empty questions array', () => {
      const invalidData: QuizData = {
        setName: 'Test',
        setDescription: 'Test description',
        questions: [],
      };

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Missing or empty 'questions' array");
    });

    it('should throw error for missing questions array', () => {
      const invalidData = {
        setName: 'Test',
        setDescription: 'Test description',
      } as QuizData;

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Missing or empty 'questions' array");
    });

    it('should throw error for invalid question ID', () => {
      const invalidData: QuizData = {
        setName: 'Test',
        setDescription: 'Test',
        questions: [
          {
            id: 'not-a-number' as any,
            question: 'Test?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            timeLimit: 10,
            points: 100,
          },
        ],
      };

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Question 1: Missing or invalid 'id' field");
    });

    it('should throw error for missing question text', () => {
      const invalidData: QuizData = {
        setName: 'Test',
        setDescription: 'Test',
        questions: [
          {
            id: 1,
            question: '',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            timeLimit: 10,
            points: 100,
          },
        ],
      };

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Question 1: Missing or invalid 'question' field");
    });

    it('should throw error for wrong number of options', () => {
      const invalidData: QuizData = {
        setName: 'Test',
        setDescription: 'Test',
        questions: [
          {
            id: 1,
            question: 'Test?',
            options: ['A', 'B', 'C'], // Only 3 options
            correctAnswer: 0,
            timeLimit: 10,
            points: 100,
          },
        ],
      };

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Question 1: 'options' must be an array of exactly 4 strings");
    });

    it('should throw error for non-string options', () => {
      const invalidData: QuizData = {
        setName: 'Test',
        setDescription: 'Test',
        questions: [
          {
            id: 1,
            question: 'Test?',
            options: ['A', 'B', 123, 'D'] as any,
            correctAnswer: 0,
            timeLimit: 10,
            points: 100,
          },
        ],
      };

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow('Question 1: All options must be strings');
    });

    it('should throw error for invalid correctAnswer', () => {
      const invalidData: QuizData = {
        setName: 'Test',
        setDescription: 'Test',
        questions: [
          {
            id: 1,
            question: 'Test?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 5, // Out of range
            timeLimit: 10,
            points: 100,
          },
        ],
      };

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Question 1: 'correctAnswer' must be an integer between 0 and 3");
    });

    it('should throw error for negative correctAnswer', () => {
      const invalidData: QuizData = {
        setName: 'Test',
        setDescription: 'Test',
        questions: [
          {
            id: 1,
            question: 'Test?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: -1,
            timeLimit: 10,
            points: 100,
          },
        ],
      };

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Question 1: 'correctAnswer' must be an integer between 0 and 3");
    });

    it('should throw error for invalid timeLimit', () => {
      const invalidData: QuizData = {
        setName: 'Test',
        setDescription: 'Test',
        questions: [
          {
            id: 1,
            question: 'Test?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            timeLimit: 0, // Must be positive
            points: 100,
          },
        ],
      };

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Question 1: 'timeLimit' must be a positive integer");
    });

    it('should throw error for invalid points', () => {
      const invalidData: QuizData = {
        setName: 'Test',
        setDescription: 'Test',
        questions: [
          {
            id: 1,
            question: 'Test?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            timeLimit: 10,
            points: -50, // Must be positive
          },
        ],
      };

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Question 1: 'points' must be a positive integer");
    });

    it('should validate all questions in array', () => {
      const invalidData: QuizData = {
        setName: 'Test',
        setDescription: 'Test',
        questions: [
          createMockQuestion({ id: 1 }),
          createMockQuestion({ id: 2 }),
          {
            id: 3,
            question: 'Invalid?',
            options: ['A', 'B'], // Invalid
            correctAnswer: 0,
            timeLimit: 10,
            points: 100,
          },
        ],
      };

      expect(() => {
        quizService.validateQuizData(invalidData);
      }).toThrow("Question 3: 'options' must be an array of exactly 4 strings");
    });
  });

  describe('addQuizToMemory', () => {
    it('should add quiz directly to memory', () => {
      quizService.addQuizToMemory(mockQuiz);

      const quiz = quizService.getQuizById('test-quiz');
      expect(quiz).toBeDefined();
      expect(quiz?.name).toBe('Test Quiz');
    });

    it('should allow adding multiple quizzes', () => {
      quizService.addQuizToMemory(mockQuiz);
      quizService.addQuizToMemory({
        id: 'quiz-2',
        name: 'Second Quiz',
        questions: [],
      });

      expect(quizService.getAllQuizzes()).toHaveLength(2);
    });
  });

  describe('clearAllQuizzes', () => {
    it('should clear all quizzes from memory', () => {
      quizService.addQuizToMemory(mockQuiz);
      quizService.addQuizToMemory({
        id: 'quiz-2',
        name: 'Second Quiz',
        questions: [],
      });

      expect(quizService.getAllQuizzes()).toHaveLength(2);

      quizService.clearAllQuizzes();

      expect(quizService.getAllQuizzes()).toHaveLength(0);
    });
  });

  describe('Integration: Create, Read, Delete flow', () => {
    it('should handle complete CRUD lifecycle', () => {
      // Create
      const createResult = quizService.createQuiz(mockQuizData);
      expect(createResult.quizId).toBeDefined();

      // Read
      const quiz = quizService.getQuizById(createResult.quizId);
      expect(quiz).toBeDefined();
      expect(quiz?.name).toBe('Test Quiz');

      // List
      const allQuizzes = quizService.getAllQuizzes();
      expect(allQuizzes).toHaveLength(1);

      // Delete
      const deleteResult = quizService.deleteQuiz(createResult.quizId);
      expect(deleteResult.message).toContain('deleted successfully');

      // Verify deletion
      const deletedQuiz = quizService.getQuizById(createResult.quizId);
      expect(deletedQuiz).toBeUndefined();
      expect(quizService.getAllQuizzes()).toHaveLength(0);
    });
  });
});
