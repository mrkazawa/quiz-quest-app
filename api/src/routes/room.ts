import express from 'express';
import RoomController from '../controllers/RoomController';

// Try to load rate limiting middleware
let rateLimits: any;
try {
  rateLimits = require('../middleware/validation').rateLimits;
} catch (e) {
  rateLimits = {
    roomCreation: (req: any, res: any, next: any) => next()
  };
}

const router = express.Router();

// Room management routes - rate limiting removed for prototype
router.get('/active-rooms', RoomController.getActiveRooms);

export default router;
