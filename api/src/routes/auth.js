const express = require("express");
const AuthController = require("../controllers/AuthController");
const { requireTeacherAuth } = require("../middleware/auth");

// Try to load rate limiting middleware
let rateLimits;
try {
  rateLimits = require("../middleware/validation").rateLimits;
} catch (e) {
  rateLimits = {
    auth: (req, res, next) => next()
  };
}

const router = express.Router();

// Teacher authentication routes with rate limiting
router.post("/verify-teacher", rateLimits.auth, AuthController.verifyTeacher);
router.get("/logout", AuthController.logout);

// Language preference routes
router.post("/set-language", AuthController.setLanguage);
router.get("/get-language", AuthController.getLanguage);

module.exports = router;
