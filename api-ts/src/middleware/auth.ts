import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';

// Authentication middleware
export const requireTeacherAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (req.session && req.session.isTeacher === true) {
    next(); // User is authenticated as teacher
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

export default {
  requireTeacherAuth
};
