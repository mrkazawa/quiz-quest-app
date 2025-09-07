const express = require("express");
const RoomController = require("../controllers/RoomController");

const router = express.Router();

// Room management routes
router.get("/active-rooms", RoomController.getActiveRooms);

module.exports = router;
