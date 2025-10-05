import express from 'express';
import AuthController from '../controllers/AuthController';
import { requireTeacherAuth } from '../middleware/auth';

const router = express.Router();

// Teacher authentication routes
router.post('/verify-teacher', AuthController.verifyTeacher);
router.get('/logout', AuthController.logout);

// Language preference routes
router.post('/set-language', AuthController.setLanguage);
router.get('/get-language', AuthController.getLanguage);

export default router;
