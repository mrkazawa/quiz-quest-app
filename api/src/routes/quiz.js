const express = require("express");
const QuizController = require("../controllers/QuizController");
const { requireTeacherAuth } = require("../middleware/auth");

const router = express.Router();

// Quiz management routes
router.get("/quizzes", QuizController.getAllQuizzes);
router.post("/create-quiz", QuizController.createQuiz);
router.delete("/quiz/:quizId", QuizController.deleteQuiz);
router.get("/quiz-template", QuizController.downloadTemplate);

module.exports = router;
