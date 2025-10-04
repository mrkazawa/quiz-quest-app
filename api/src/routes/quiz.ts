import express from 'express';
import QuizController from '../controllers/QuizController';
import { requireTeacherAuth } from '../middleware/auth';

// Try to load rate limiting middleware
let rateLimits: any;
try {
  rateLimits = require('../middleware/validation').rateLimits;
} catch (e) {
  rateLimits = {
    quizCreation: (req: any, res: any, next: any) => next()
  };
}

const router = express.Router();

// Quiz management routes
router.get('/quizzes', QuizController.getAllQuizzes);
router.post('/create-quiz', rateLimits.quizCreation, QuizController.createQuiz);
router.delete('/quiz/:quizId', QuizController.deleteQuiz);
router.get('/quiz-template', QuizController.downloadTemplate);

export default router;
