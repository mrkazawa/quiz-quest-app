import fs from 'fs';
import path from 'path';
import { Quiz, QuizData, QuizSummary, CreateQuizResult, DeleteQuizResult, Question } from '../types/quiz';

/**
 * QuizService - Manages quiz data and operations
 * Supports both file-based persistence and in-memory testing
 */
export class QuizService {
  private questionSets: Record<string, Quiz> = {};
  private fileWatchCache = new Map<string, number>();
  private questionsDir: string;
  private watcher?: fs.FSWatcher;

  constructor(questionsDir?: string, autoLoad: boolean = true) {
    this.questionsDir = questionsDir || path.join(__dirname, '../../../questions');
    
    if (autoLoad) {
      this.loadQuestions();
      
      // Set up file watching for automatic reload in development
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        this.setupFileWatcher();
      }
    }
  }

  private setupFileWatcher(): void {
    const questionsDir = this.questionsDir;
    
    try {
      if (fs.existsSync(questionsDir)) {
        this.watcher = fs.watch(questionsDir, (eventType, filename) => {
          if (filename && filename.endsWith('.json')) {
            console.log(`📁 Quiz file ${filename} changed, reloading...`);
            setTimeout(() => this.loadQuestions(), 100); // Debounce
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Could not set up file watcher:', (error as Error).message);
    }
  }

  public loadQuestions(): void {
    const questionsDir = this.questionsDir;

    try {
      if (fs.existsSync(questionsDir)) {
        const files = fs
          .readdirSync(questionsDir)
          .filter((file) => file.endsWith('.json'));

        files.forEach((file) => {
          const filePath = path.join(questionsDir, file);
          const fileData = fs.readFileSync(filePath, 'utf8');
          const quizData = JSON.parse(fileData);

          // Check if the quiz data is in the new format with metadata
          if (quizData.setName && quizData.questions) {
            // New format with metadata
            const quizId = quizData.roomId || path.basename(file, '.json');
            this.questionSets[quizId] = {
              id: quizId,
              name: quizData.setName,
              description: quizData.setDescription || '',
              questions: quizData.questions,
            };
            console.log(
              `📚 Loaded ${quizData.questions.length} questions from ${file} (${quizData.setName})`
            );
          } else {
            // Legacy format: directly an array of questions
            const questions = Array.isArray(quizData) ? quizData : [];
            const quizId = path.basename(file, '.json');
            this.questionSets[quizId] = {
              id: quizId,
              name: quizId,
              questions: questions,
            };
            console.log(
              `📚 Loaded ${questions.length} questions from ${file} (legacy format)`
            );
          }
        });

        console.log(`📊 Loaded ${Object.keys(this.questionSets).length} quiz sets`);
      } else {
        console.warn('⚠️ Questions directory does not exist:', questionsDir);
      }
    } catch (error) {
      console.error('❌ Error loading questions:', error);
    }
  }

  public getAllQuizzes(): QuizSummary[] {
    return Object.keys(this.questionSets).map((quizId) => {
      const questionSet = this.questionSets[quizId];
      return {
        id: quizId,
        name: questionSet.name,
        description: questionSet.description || 'No description available',
        questionCount: questionSet.questions.length,
      };
    });
  }

  public getQuizById(quizId: string): Quiz | undefined {
    return this.questionSets[quizId];
  }

  public createQuiz(quizData: QuizData): CreateQuizResult {
    // Validate quiz data first
    this.validateQuizData(quizData);

    // Generate unique quiz ID from the name
    const baseId = quizData.setName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();

    let quizId = baseId;
    let counter = 1;

    // Ensure unique ID
    while (this.questionSets[quizId]) {
      quizId = `${baseId}-${counter}`;
      counter++;
    }

    // Add the quiz to memory
    this.questionSets[quizId] = {
      id: quizId,
      name: quizData.setName,
      description: quizData.setDescription,
      questions: quizData.questions,
      createdAt: new Date().toISOString()
    };

    // Save to file for persistence (skip in test environment)
    if (process.env.NODE_ENV !== 'test') {
      this.saveQuizToFile(quizId, quizData);
    }

    return { quizId, message: `Quiz "${quizData.setName}" created successfully` };
  }

  private saveQuizToFile(quizId: string, quizData: QuizData): void {
    try {
      const questionsDir = this.questionsDir;

      if (!fs.existsSync(questionsDir)) {
        fs.mkdirSync(questionsDir, { recursive: true });
      }

      const fileName = `${quizId}.json`;
      const filePath = path.join(questionsDir, fileName);

      const fileContent = {
        setName: quizData.setName,
        roomId: quizId,
        setDescription: quizData.setDescription,
        questions: quizData.questions
      };

      fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));
      console.log(`💾 Quiz saved to file: ${filePath}`);
    } catch (fileError) {
      console.warn('⚠️ Failed to save quiz to file:', (fileError as Error).message);
      throw new Error('Failed to save quiz to disk');
    }
  }

  public deleteQuiz(quizId: string): DeleteQuizResult {
    if (!this.questionSets[quizId]) {
      throw new Error('Quiz not found');
    }

    const quizName = this.questionSets[quizId].name;

    // Remove from memory
    delete this.questionSets[quizId];

    // Delete the file from disk (skip in test environment)
    if (process.env.NODE_ENV !== 'test') {
      const questionsDir = this.questionsDir;
      const filePath = path.join(questionsDir, `${quizId}.json`);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted quiz file: ${filePath}`);
      }
    }

    return { message: `Quiz "${quizName}" deleted successfully` };
  }

  public validateQuizData(quizData: QuizData): boolean {
    // Validate required fields
    if (!quizData.setName || typeof quizData.setName !== 'string') {
      throw new Error("Missing or invalid 'setName' field");
    }

    if (!quizData.setDescription || typeof quizData.setDescription !== 'string') {
      throw new Error("Missing or invalid 'setDescription' field");
    }

    if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error("Missing or empty 'questions' array");
    }

    // Validate each question
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      const qNum = i + 1;

      if (!Number.isInteger(q.id)) {
        throw new Error(`Question ${qNum}: Missing or invalid 'id' field`);
      }

      if (!q.question || typeof q.question !== 'string') {
        throw new Error(`Question ${qNum}: Missing or invalid 'question' field`);
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${qNum}: 'options' must be an array of exactly 4 strings`);
      }

      if (!q.options.every(opt => typeof opt === 'string')) {
        throw new Error(`Question ${qNum}: All options must be strings`);
      }

      if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 3) {
        throw new Error(`Question ${qNum}: 'correctAnswer' must be an integer between 0 and 3`);
      }

      if (!Number.isInteger(q.timeLimit) || q.timeLimit <= 0) {
        throw new Error(`Question ${qNum}: 'timeLimit' must be a positive integer`);
      }

      if (!Number.isInteger(q.points) || q.points <= 0) {
        throw new Error(`Question ${qNum}: 'points' must be a positive integer`);
      }
    }

    return true;
  }

  /**
   * Add a quiz directly to memory (useful for testing or in-memory quizzes)
   */
  public addQuizToMemory(quiz: Quiz): void {
    this.questionSets[quiz.id] = quiz;
  }

  /**
   * Clear all quizzes from memory (useful for testing)
   */
  public clearAllQuizzes(): void {
    this.questionSets = {};
  }

  /**
   * Cleanup resources (file watchers, etc.)
   */
  public cleanup(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }
  }
}

// Export singleton instance
export default new QuizService();
