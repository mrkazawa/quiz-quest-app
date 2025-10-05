import express from 'express';
import RoomController from '../controllers/RoomController';

const router = express.Router();

// Room management routes
router.get('/active-rooms', RoomController.getActiveRooms);

export default router;
