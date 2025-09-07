const RoomService = require("../services/RoomService");
const QuizService = require("../services/QuizService");

class RoomController {
  static async getActiveRooms(req, res) {
    try {
      // Only allow teachers to see active rooms
      if (!req.session || !req.session.isTeacher) {
        return res.status(403).json({ error: "Unauthorized" });
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

module.exports = RoomController;
