import express from 'express';
import HistoryController from '../controllers/HistoryController';

const router = express.Router();

// Quiz history routes
router.get('/quiz-history', HistoryController.getAllHistory);
router.get('/quiz-history/:historyId', HistoryController.getHistoryById);

export default router;
