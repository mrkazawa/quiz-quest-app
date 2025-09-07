import { Request, Response } from 'express';
import HistoryService from '../services/HistoryService';
import { AuthenticatedRequest } from '../types/express';

class HistoryController {
  static async getAllHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only allow teachers to see quiz history
      if (!req.session || !req.session.isTeacher) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }

      const historyList = HistoryService.getAllHistory();
      res.json(historyList);
    } catch (error) {
      console.error('Error getting quiz history:', error);
      res.status(500).json({ error: 'Failed to retrieve quiz history' });
    }
  }

  static async getHistoryById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only allow teachers to see quiz history
      if (!req.session || !req.session.isTeacher) {
        console.log(`🚫 Unauthorized access to history ${req.params.historyId}`);
        res.status(403).json({ error: "Unauthorized" });
        return;
      }

      const { historyId } = req.params;
      console.log(`📊 Fetching history for room ${historyId}`);
      
      const historyItem = HistoryService.getHistoryById(historyId);

      if (!historyItem) {
        console.log(`❌ History not found for room ${historyId}`);
        res.status(404).json({ error: "History not found" });
        return;
      }

      console.log(`✅ Found history for room ${historyId}:`, historyItem.quizName);
      res.json(historyItem);
    } catch (error) {
      console.error('Error getting quiz history detail:', error);
      res.status(500).json({ error: 'Failed to retrieve quiz history detail' });
    }
  }
}

export default HistoryController;
