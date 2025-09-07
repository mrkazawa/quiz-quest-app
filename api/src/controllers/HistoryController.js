const HistoryService = require("../services/HistoryService");

class HistoryController {
  static async getAllHistory(req, res) {
    try {
      // Only allow teachers to see quiz history
      if (!req.session || !req.session.isTeacher) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const historyList = HistoryService.getAllHistory();
      res.json(historyList);
    } catch (error) {
      console.error('Error getting quiz history:', error);
      res.status(500).json({ error: 'Failed to retrieve quiz history' });
    }
  }

  static async getHistoryById(req, res) {
    try {
      // Only allow teachers to see quiz history
      if (!req.session || !req.session.isTeacher) {
        console.log(`🚫 Unauthorized access to history ${req.params.historyId}`);
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { historyId } = req.params;
      console.log(`📊 Fetching history for room ${historyId}`);
      
      const historyItem = HistoryService.getHistoryById(historyId);

      if (!historyItem) {
        console.log(`❌ History not found for room ${historyId}`);
        console.log(`📋 Available history IDs:`, Object.keys(HistoryService.quizHistory || {}));
        return res.status(404).json({ error: "History not found" });
      }

      console.log(`✅ Found history for room ${historyId}:`, historyItem.quizName);
      res.json(historyItem);
    } catch (error) {
      console.error('Error getting quiz history detail:', error);
      res.status(500).json({ error: 'Failed to retrieve quiz history detail' });
    }
  }
}

module.exports = HistoryController;
