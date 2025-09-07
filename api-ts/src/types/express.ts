import { Request, Response } from 'express';
import { Session } from 'express-session';

export interface AuthenticatedSession extends Session {
  isTeacher?: boolean;
  userId?: string;
  username?: string;
}

export interface AuthenticatedRequest extends Request {
  session: AuthenticatedSession;
  body: any;
  params: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ControllerMethod {
  (req: Request, res: Response): Promise<void> | void;
}

export interface AuthenticatedControllerMethod {
  (req: AuthenticatedRequest, res: Response): Promise<void> | void;
}
