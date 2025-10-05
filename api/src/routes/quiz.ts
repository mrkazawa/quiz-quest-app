import express from 'express';
import QuizController from '../controllers/QuizController';
import { requireTeacherAuth } from '../middleware/auth';

const router = express.Router();

// Quiz management routes
router.get('/quizzes', QuizController.getAllQuizzes);
router.post('/create-quiz', QuizController.createQuiz);
router.delete('/quiz/:quizId', QuizController.deleteQuiz);
router.get('/quiz-template', QuizController.downloadTemplate);

export default router;
