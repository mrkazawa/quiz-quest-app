import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';

class AuthController {
  static async verifyTeacher(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { password } = req.body;
      const correctPassword = process.env.TEACHER_PASSWORD || "quizmaster123";

      if (password === correctPassword) {
        req.session.isTeacher = true;
        res.json({ 
          success: true, 
          redirect: "/teacher/dashboard" 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: "Incorrect password" 
        });
      }
    } catch (error) {
      console.error('Error verifying teacher:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      req.session.isTeacher = false;
      (req.session as any).destroy((err: any) => {
        if (err) {
          console.error('Error destroying session:', err);
          res.status(500).json({ error: 'Failed to logout' });
          return;
        }
        res.json({ success: true, message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Error logging out:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async setLanguage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { language } = req.body;
      
      if (!language || !['en', 'id'].includes(language)) {
        res.status(400).json({ error: 'Invalid language' });
        return;
      }
      
      (req.session as any).language = language;
      res.json({ success: true });
    } catch (error) {
      console.error('Error setting language:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getLanguage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const language = (req.session as any).language || 'en';
      res.json({ language });
    } catch (error) {
      console.error('Error getting language:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AuthController;
