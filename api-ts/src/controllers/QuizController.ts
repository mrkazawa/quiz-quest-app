import { Request, Response } from 'express';
import path from 'path';
import QuizService from '../services/QuizService';
import { AuthenticatedRequest } from '../types/express';

class QuizController {
  static async getAllQuizzes(req: Request, res: Response): Promise<void> {
    try {
      const quizzes = QuizService.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error('Error getting quizzes:', error);
      res.status(500).json({ error: 'Failed to retrieve quizzes' });
    }
  }

  static async createQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only allow teachers to create quizzes
      if (!req.session || !req.session.isTeacher) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const quizData = req.body;

      // Validate quiz data
      QuizService.validateQuizData(quizData);

      // Create the quiz
      const result = QuizService.createQuiz(quizData);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(400).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }

  static async deleteQuiz(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only allow teachers to delete quizzes
      if (!req.session || !req.session.isTeacher) {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }

      const { quizId } = req.params;
      const result = QuizService.deleteQuiz(quizId);

      res.json({ 
        success: true, 
        ...result
      });

    } catch (error) {
      console.error('Error deleting quiz:', error);
      if ((error as Error).message === 'Quiz not found') {
        res.status(404).json({ 
          success: false, 
          error: (error as Error).message 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error' 
        });
      }
    }
  }

  static async downloadTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templatePath = path.join(__dirname, "../../../docs", "template-quiz.json");
      
      res.download(templatePath, "template-quiz.json", (err) => {
        if (err) {
          console.error("Error sending template file:", err);
          res.status(404).json({ error: "Template file not found" });
        }
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      res.status(500).json({ error: 'Failed to download template' });
    }
  }
}

export default QuizController;
