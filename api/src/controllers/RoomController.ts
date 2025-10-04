import { Request, Response } from 'express';
import RoomService from '../services/RoomService';
import QuizService from '../services/QuizService';
import { AuthenticatedRequest } from '../types/express';

class RoomController {
  static async getActiveRooms(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only allow teachers to see active rooms
      if (!req.session || !req.session.isTeacher) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }

      const activeRooms = RoomService.getActiveRooms();
      
      // Enhance room data with quiz names
      for (const roomId in activeRooms) {
        const room = activeRooms[roomId];
        const quizSet = QuizService.getQuizById(room.quizId);
        room.quizName = quizSet ? quizSet.name || room.quizId : room.quizId;
      }

      res.json(activeRooms);
    } catch (error) {
      console.error('Error getting active rooms:', error);
      res.status(500).json({ error: 'Failed to retrieve active rooms' });
    }
  }
}

export default RoomController;
