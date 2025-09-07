const RoomService = require("../../services/RoomService");
const QuizService = require("../../services/QuizService");

function register(socket, io) {
  // Student joins a quiz room
  socket.on("join_room", (data) => {
    handleStudentJoinRoom(socket, io, data);
  });

  // Student explicitly leaves room
  socket.on("leave_room", (roomId, deleteRoom = false) => {
    handleStudentLeaveRoom(socket, io, roomId, deleteRoom);
  });
}

function handleStudentJoinRoom(socket, io, data) {
  const { roomId, playerName, studentId } = data;

  try {
    const room = RoomService.getRoom(roomId);
    if (!room) {
      socket.emit("join_error", "Room does not exist");
      return;
    }

    // Add player to room
    const player = RoomService.addPlayerToRoom(roomId, {
      socketId: socket.id,
      playerName,
      studentId
    });

    // Join socket room
    socket.join(roomId);

    // Get quiz info
    const quizSet = QuizService.getQuizById(room.quizId);
    const joinedRoomData = {
      roomId,
      questionId: room.questionId,
      isActive: room.isActive,
      quizName: quizSet ? quizSet.name : room.quizId,
      players: Object.values(room.players).map((p) => ({
        id: p.socketId,
        name: p.name,
        studentId: p.studentId,
        score: p.score,
      })),
    };

    console.log(`📥 Student ${playerName} joined room ${roomId}`);
    socket.emit("joined_room", joinedRoomData);

    // Handle rejoining active quiz
    if (room.isActive && room.currentQuestionIndex >= 0) {
      handleStudentRejoinActiveQuiz(socket, room, player);
    }

    // Notify others
    io.to(roomId).emit("player_joined", {
      playerId: socket.id,
      playerName,
      studentId,
      players: Object.values(room.players).map((p) => ({
        id: p.socketId,
        name: p.name,
        studentId: p.studentId,
        score: p.score,
      })),
    });

  } catch (error) {
    console.error("Error handling student join:", error);
    socket.emit("join_error", error.message);
  }
}

function handleStudentRejoinActiveQuiz(socket, room, player) {
  const currentQuestionObj = RoomService.getCurrentQuestion(room.roomId || Object.keys(RoomService.rooms).find(id => RoomService.rooms[id] === room));
  if (!currentQuestionObj) return;

  const hasAnswered = player.answers.some(
    (a) => a.questionId === currentQuestionObj.id
  );

  // Calculate remaining time
  let remainingTime = currentQuestionObj.timeLimit;
  if (room.questionStartTime) {
    const elapsed = Math.floor((Date.now() - room.questionStartTime) / 1000);
    remainingTime = Math.max(0, currentQuestionObj.timeLimit - elapsed);
  }

  // Check if question has ended
  if (room.questionEndedState || remainingTime <= 1) {
    // Send question results
    if (!hasAnswered) {
      player.answers.push({
        questionId: currentQuestionObj.id,
        answerId: null,
        isCorrect: false,
        timeTaken: currentQuestionObj.timeLimit,
      });
    }

    const questionResults = {
      questionId: currentQuestionObj.id,
      question: currentQuestionObj.question,
      options: currentQuestionObj.options,
      correctAnswer: currentQuestionObj.correctAnswer,
      playerAnswers: Object.values(room.players).map((p) => {
        const answer = p.answers.find((a) => a.questionId === currentQuestionObj.id);
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

    socket.emit("question_ended", questionResults);
  } else {
    // Send active question
    socket.emit("new_question", {
      question: currentQuestionObj.question,
      options: currentQuestionObj.options,
      timeLimit: currentQuestionObj.timeLimit,
      remainingTime: remainingTime,
      questionId: currentQuestionObj.id,
      currentScore: player.score,
      currentStreak: player.streak,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questionOrder.length,
      hasAnswered: hasAnswered,
      questionExpired: remainingTime <= 1,
    });
  }
}

function handleStudentLeaveRoom(socket, io, roomId, deleteRoom) {
  const room = RoomService.getRoom(roomId);
  if (!room) return;

  const result = RoomService.removePlayerFromRoom(roomId, socket.id);
  if (result) {
    console.log(`📤 Student left room ${roomId}`);
    
    io.to(roomId).emit("player_left", {
      playerId: socket.id,
      players: Object.values(room.players).map((p) => ({
        id: p.socketId,
        name: p.name,
        score: p.score,
      })),
    });
  }

  socket.leave(roomId);
}

function handleDisconnect(socket, io) {
  // Handle student disconnection from rooms
  for (const roomId in RoomService.rooms) {
    const room = RoomService.getRoom(roomId);
    const studentId = room.socketToStudent?.[socket.id];

    if (studentId && room.players[studentId]) {
      const player = room.players[studentId];
      console.log(`📤 Student ${player.name} disconnected from room ${roomId}`);

      // Remove socket mapping but keep player data for reconnection
      delete room.socketToStudent[socket.id];
      room.players[studentId].socketId = null;

      // Notify others
      io.to(roomId).emit("player_disconnected", {
        playerId: socket.id,
        studentId: studentId,
        playerName: player.name,
      });
    }
  }
}

module.exports = {
  register,
  handleDisconnect
};
