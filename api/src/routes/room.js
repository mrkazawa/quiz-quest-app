const express = require("express");
const RoomController = require("../controllers/RoomController");

// Try to load rate limiting middleware
let rateLimits;
try {
  rateLimits = require("../middleware/validation").rateLimits;
} catch (e) {
  rateLimits = {
    roomCreation: (req, res, next) => next()
  };
}

const router = express.Router();

// Room management routes - rate limit applied to active room checks
router.get("/active-rooms", rateLimits.roomCreation, RoomController.getActiveRooms);

module.exports = router;
