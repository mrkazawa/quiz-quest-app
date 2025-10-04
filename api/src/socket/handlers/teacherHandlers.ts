import { TypedSocket, TypedServer } from '../../types/socket';
import RoomService from '../../services/RoomService';
import HistoryService from '../../services/HistoryService';
import QuizService from '../../services/QuizService';
import logger from '../../utils/logger';

function register(socket: TypedSocket, io: TypedServer): void {
  // Teacher creates a room
  socket.on('create_room', (data) => {
    handleCreateRoom(socket, io, data);
  });

  // Teacher joins an existing room
  socket.on('join_teacher_room', (data) => {
    handleTeacherJoinRoom(socket, io, data);
  });

  // Teacher gets room info
  socket.on('get_room_info', (data) => {
    handleGetRoomInfo(socket, io, data);
  });

  // Teacher deletes a room
  socket.on('delete_room', (data) => {
    handleDeleteRoom(socket, io, data);
  });
}

function handleCreateRoom(socket: TypedSocket, io: TypedServer, data: any): void {
  logger.debug('Received create_room event:', data);
  const { quizId, teacherId } = data;

  const questionSet = QuizService.getQuizById(quizId);
  if (!questionSet) {
    logger.warn('Quiz not found:', quizId);
    socket.emit('room_error', 'Quiz not found');
    return;
  }

  try {
    const roomId = RoomService.createRoom(quizId, teacherId, questionSet);
    const room = RoomService.getRoom(roomId);
    
    if (!room) {
      socket.emit('room_error', 'Failed to create room');
      return;
    }

    // Set teacher as host
    room.hostId = socket.id;
    RoomService.updateTeacherSession(socket.id, teacherId);

    socket.join(roomId);
    socket.emit('room_created', { roomId, quizId });

    logger.info(`Teacher created room ${roomId} for quiz ${quizId}`);
  } catch (error) {
    logger.error('Error creating room:', error);
    socket.emit('room_error', 'Failed to create room');
  }
}

function handleTeacherJoinRoom(socket: TypedSocket, io: TypedServer, data: any): void {
  const { roomId, teacherId } = data;

  const room = RoomService.getRoom(roomId);
  if (!room) {
    // Check if room is in history (completed)
    const historyItem = HistoryService.getHistoryById(roomId);
    if (historyItem) {
      socket.emit('teacher_joined_completed_room', {
        roomId,
        isCompleted: true,
        historyId: roomId,
      });
      
      // Also send the quiz rankings immediately for final results view
      socket.emit('quiz_rankings', historyItem);
      
      logger.info(`Teacher joined completed room ${roomId} from history`);
      return;
    }

    socket.emit('join_error', 'Room not found');
    return;
  }

  // Handle completed rooms
  if (room.isCompleted) {
    socket.emit('teacher_joined_completed_room', {
      roomId,
      isCompleted: true,
      historyId: roomId,
    });

    // Send quiz rankings for completed rooms
    const rankings = Object.values(room.players)
      .sort((a: any, b: any) => b.score - a.score)
      .map((p: any, index: number) => ({
        rank: index + 1,
        playerId: p.socketId,
        playerName: p.name,
        studentId: p.studentId,
        score: p.score,
      }));

    const quizSet = QuizService.getQuizById(room.quizId);
    const quizRankings = {
      id: roomId,
      roomId: roomId,
      quizId: room.quizId,
      quizName: quizSet ? quizSet.name : room.quizId,
      dateCompleted: new Date(room.completedAt || Date.now()).toISOString(),
      playerCount: Object.keys(room.players).length,
      rankings: rankings,
    };

    socket.emit('quiz_rankings', quizRankings);
    
    logger.info(`Teacher joined completed room ${roomId} for final results`);
    return;
  }

  // Check authorization
  const isSameTeacher = room.teacherSessionId === teacherId;
  if (room.hostId !== null && room.hostId !== socket.id && !isSameTeacher) {
    socket.emit('join_error', 'Another teacher is already hosting this room');
    return;
  }

  // Update room with teacher info
  room.hostId = socket.id;
  room.teacherSessionId = teacherId;
  RoomService.updateTeacherSession(socket.id, teacherId);
  socket.join(roomId);

  logger.info(`Teacher ${teacherId} joined room ${roomId}`);

  // Send room info
  socket.emit('teacher_joined_room', {
    roomId,
    isActive: room.isActive,
    players: Object.values(room.players).map((p: any) => ({
      id: p.socketId,
      name: p.name,
      studentId: p.studentId,
      score: p.score,
    })),
  });

  // If room is active, send current question state
  if (room.isActive) {
    handleTeacherRejoinActiveQuiz(socket, room, roomId);
  }
}

function handleTeacherRejoinActiveQuiz(socket: TypedSocket, room: any, roomId: string): void {
  const currentQuestionObj = RoomService.getCurrentQuestion(roomId);
  
  if (!currentQuestionObj) return;

  // Calculate remaining time
  let remainingTime = currentQuestionObj.timeLimit;
  if (room.questionStartTime) {
    const elapsed = Math.floor((Date.now() - room.questionStartTime) / 1000);
    remainingTime = Math.max(0, currentQuestionObj.timeLimit - elapsed);
  }

  if (room.questionEndedState || remainingTime <= 1) {
    // Send question results
    const questionResults = {
      questionId: currentQuestionObj.id,
      question: currentQuestionObj.question,
      options: currentQuestionObj.options,
      correctAnswer: currentQuestionObj.correctAnswer,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questionOrder.length,
      playerAnswers: Object.values(room.players).map((p: any) => {
        const answer = p.answers.find((a: any) => a.questionId === currentQuestionObj.id);
        return {
          playerId: p.socketId,
          playerName: p.name,
          studentId: p.studentId,
          answerId: answer ? answer.answerId : null,
          isCorrect: answer ? answer.isCorrect : false,
          score: p.score,
          streak: p.streak,
        };
      }),
    };

    socket.emit('question_ended', questionResults);
  } else {
    // Send active question
    socket.emit('new_question', {
      question: currentQuestionObj.question,
      options: currentQuestionObj.options,
      timeLimit: currentQuestionObj.timeLimit,
      remainingTime: remainingTime,
      questionId: currentQuestionObj.id,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questionOrder.length,
    });
  }
}

function handleGetRoomInfo(socket: TypedSocket, io: TypedServer, data: any): void {
  logger.debug('Received get_room_info event:', data);
  const { roomId } = data;

  const room = RoomService.getRoom(roomId);
  if (!room) {
    socket.emit('room_error', 'Room not found');
    return;
  }

  // Update host if needed
  if (room.hostId !== socket.id) {
    room.hostId = socket.id;
    socket.join(roomId);
  }

  const quizSet = QuizService.getQuizById(room.quizId);
  
  socket.emit('room_info', {
    roomId: roomId,
    quizName: quizSet ? quizSet.name : room.quizId,
    students: Object.values(room.players).map((player: any) => ({
      socketId: player.socketId,
      studentId: player.studentId,
      name: player.name,
      joinedAt: Date.now()
    }))
  });

  logger.debug(`Room info sent for room ${roomId}`);
}

function handleDeleteRoom(socket: TypedSocket, io: TypedServer, data: any): void {
  const { roomId } = data;

  const room = RoomService.getRoom(roomId);
  if (!room) {
    socket.emit('room_error', 'Room not found');
    return;
  }

  // Verify authorization
  if (room.hostId !== socket.id) {
    socket.emit('room_error', 'Not authorized to delete this room');
    return;
  }

  // Notify all players
  io.to(roomId).emit('room_deleted', { message: 'Room was deleted by teacher' });

  // Delete the room
  RoomService.deleteRoom(roomId);
  logger.info(`Room ${roomId} was deleted by teacher`);
}

function handleDisconnect(socket: TypedSocket, io: TypedServer): void {
  // Clean up teacher sessions
  RoomService.cleanupTeacherSession(socket.id);

  // Handle teacher disconnection from rooms
  const allRooms = RoomService.getAllRooms();
  
  for (const roomId in allRooms) {
    const room = RoomService.getRoom(roomId);

    if (room && room.hostId === socket.id) {
      logger.info(`Teacher disconnected from room ${roomId}`);

      if (!room.isActive) {
        // Waiting room - allow teacher to rejoin
        room.hostId = null;
        
        // Set timeout to delete room if teacher doesn't rejoin
        setTimeout(() => {
          const currentRoom = RoomService.getRoom(roomId);
          if (currentRoom && currentRoom.hostId === null) {
            io.to(roomId).emit('quiz_ended', {
              message: "Room closed due to teacher inactivity"
            });
            RoomService.deleteRoom(roomId);
            logger.info(`Room ${roomId} deleted due to teacher inactivity`);
          }
        }, 5 * 60 * 1000); // 5 minutes
      } else {
        // Active quiz - shorter timeout for reconnection
        room.hostId = null;
        
        setTimeout(() => {
          const currentRoom = RoomService.getRoom(roomId);
          if (currentRoom && currentRoom.hostId === null) {
            currentRoom.isActive = false;
            io.to(roomId).emit('quiz_ended', {
              message: "Host disconnected"
            });
            RoomService.deleteRoom(roomId);
            logger.info(`Room ${roomId} deleted - teacher didn't rejoin active quiz`);
          }
        }, 30 * 1000); // 30 seconds
      }
    }
  }
}

export default {
  register,
  handleDisconnect
};
