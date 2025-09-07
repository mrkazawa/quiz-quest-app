const express = require("express");
const QuizController = require("../controllers/QuizController");
const { requireTeacherAuth } = require("../middleware/auth");

// Try to load rate limiting middleware
let rateLimits;
try {
  rateLimits = require("../middleware/validation").rateLimits;
} catch (e) {
  rateLimits = {
    quizCreation: (req, res, next) => next()
  };
}

const router = express.Router();

// Quiz management routes
router.get("/quizzes", QuizController.getAllQuizzes);
router.post("/create-quiz", rateLimits.quizCreation, QuizController.createQuiz);
router.delete("/quiz/:quizId", QuizController.deleteQuiz);
router.get("/quiz-template", QuizController.downloadTemplate);

module.exports = router;
