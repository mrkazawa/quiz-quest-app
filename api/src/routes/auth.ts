import express from 'express';
import AuthController from '../controllers/AuthController';
import { requireTeacherAuth } from '../middleware/auth';

// Try to load rate limiting middleware
let rateLimits: any;
try {
  rateLimits = require('../middleware/validation').rateLimits;
} catch (e) {
  rateLimits = {
    auth: (req: any, res: any, next: any) => next()
  };
}

const router = express.Router();

// Teacher authentication routes with rate limiting
router.post('/verify-teacher', rateLimits.auth, AuthController.verifyTeacher);
router.get('/logout', AuthController.logout);

// Language preference routes
router.post('/set-language', AuthController.setLanguage);
router.get('/get-language', AuthController.getLanguage);

export default router;
