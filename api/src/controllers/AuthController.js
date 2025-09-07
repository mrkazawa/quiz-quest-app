class AuthController {
  static async verifyTeacher(req, res) {
    try {
      const { password } = req.body;
      const correctPassword = process.env.TEACHER_PASSWORD || "quizmaster123";

      if (password === correctPassword) {
        req.session.isTeacher = true;
        res.json({ 
          success: true, 
          redirect: "/teacher/dashboard" 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: "Incorrect password" 
        });
      }
    } catch (error) {
      console.error('Error verifying teacher:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async logout(req, res) {
    try {
      req.session.isTeacher = false;
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Error logging out:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async setLanguage(req, res) {
    try {
      const { language } = req.body;
      
      if (!language || !['en', 'id'].includes(language)) {
        return res.status(400).json({ error: 'Invalid language' });
      }
      
      req.session.language = language;
      res.json({ success: true });
    } catch (error) {
      console.error('Error setting language:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getLanguage(req, res) {
    try {
      const language = req.session.language || 'en';
      res.json({ language });
    } catch (error) {
      console.error('Error getting language:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = AuthController;
