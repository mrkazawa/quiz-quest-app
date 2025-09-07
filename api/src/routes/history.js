const express = require("express");
const HistoryController = require("../controllers/HistoryController");

const router = express.Router();

// Quiz history routes
router.get("/quiz-history", HistoryController.getAllHistory);
router.get("/quiz-history/:historyId", HistoryController.getHistoryById);

module.exports = router;
