const QuizService = require("../services/QuizService");

class QuizController {
  static async getAllQuizzes(req, res) {
    try {
      const quizzes = QuizService.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error('Error getting quizzes:', error);
      res.status(500).json({ error: 'Failed to retrieve quizzes' });
    }
  }

  static async createQuiz(req, res) {
    try {
      // Only allow teachers to create quizzes
      if (!req.session || !req.session.isTeacher) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const quizData = req.body;

      // Validate quiz data
      QuizService.validateQuizData(quizData);

      // Create the quiz
      const result = QuizService.createQuiz(quizData);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  static async deleteQuiz(req, res) {
    try {
      // Only allow teachers to delete quizzes
      if (!req.session || !req.session.isTeacher) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { quizId } = req.params;
      const result = QuizService.deleteQuiz(quizId);

      res.json({ 
        success: true, 
        ...result
      });

    } catch (error) {
      console.error('Error deleting quiz:', error);
      if (error.message === 'Quiz not found') {
        res.status(404).json({ 
          success: false, 
          error: error.message 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error' 
        });
      }
    }
  }

  static async downloadTemplate(req, res) {
    try {
      const path = require('path');
      const templatePath = path.join(__dirname, "../../../docs", "template-quiz.json");
      
      res.download(templatePath, "template-quiz.json", (err) => {
        if (err) {
          console.error("Error sending template file:", err);
          res.status(404).json({ error: "Template file not found" });
        }
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      res.status(500).json({ error: 'Failed to download template' });
    }
  }
}

module.exports = QuizController;
