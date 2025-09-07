class RoomService {
  constructor() {
    this.rooms = {};
    this.teacherSessions = {};
  }

  createRoom(quizId, teacherId, questionSet) {
    // Generate a unique 6-digit numeric room code
    let roomCode;
    do {
      roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.rooms[roomCode]);

    const roomId = roomCode;

    // Convert questions array to a map by id for consistency
    const questionsMap = {};
    questionSet.questions.forEach((q) => {
      questionsMap[q.id] = q;
    });

    this.rooms[roomId] = {
      quizId: quizId,
      questions: questionsMap,
      questionOrder: questionSet.questions.map((q) => q.id),
      players: {},
      socketToStudent: {},
      studentHistory: new Set(),
      isActive: false,
      currentQuestionIndex: 0,
      results: {},
      hostId: null, // Will be set when teacher joins
      teacherSessionId: teacherId,
      createdAt: Date.now(),
      questionEndedState: false,
    };

    return roomId;
  }

  getRoom(roomId) {
    return this.rooms[roomId];
  }

  deleteRoom(roomId) {
    if (this.rooms[roomId]) {
      const room = this.rooms[roomId];
      
      // Clear any active timers
      if (room.timer) {
        clearTimeout(room.timer);
        room.timer = null;
      }
      
      // Clear deletion timer if exists
      if (room.deletionTimer) {
        clearTimeout(room.deletionTimer);
        room.deletionTimer = null;
      }
      
      // Clean up references to prevent memory leaks
      room.players = {};
      room.socketToStudent = {};
      room.results = {};
      
      delete this.rooms[roomId];
      return true;
    }
    return false;
  }

  addPlayerToRoom(roomId, playerData) {
    const room = this.rooms[roomId];
    if (!room) return null;

    const { socketId, playerName, studentId } = playerData;

    // Check if studentId is already present in the room (for rejoining)
    const isRejoin = room.players[studentId] !== undefined;
    const hasBeenInRoom = room.studentHistory.has(studentId);

    // For active quizzes, allow rejoining if student was previously in the room
    if (room.isActive && !isRejoin && !hasBeenInRoom) {
      throw new Error("Quiz already started. Cannot join this room.");
    }

    // Add student to history
    room.studentHistory.add(studentId);

    // Update socket mapping
    room.socketToStudent[socketId] = studentId;

    // If rejoining, update the existing player data
    if (isRejoin) {
      room.players[studentId].socketId = socketId;
      room.players[studentId].name = playerName;
    } else {
      // New join - create new player entry
      room.players[studentId] = {
        socketId: socketId,
        studentId: studentId,
        name: playerName,
        score: 0,
        streak: 0,
        answers: [],
      };
    }

    return room.players[studentId];
  }

  removePlayerFromRoom(roomId, socketId) {
    const room = this.rooms[roomId];
    if (!room) return false;

    const studentId = room.socketToStudent[socketId];
    if (studentId && room.players[studentId]) {
      // Remove socket mapping
      delete room.socketToStudent[socketId];
      // Remove player entirely when they explicitly leave
      delete room.players[studentId];
      return { studentId, removed: true };
    }
    return false;
  }

  updateTeacherSession(socketId, teacherId) {
    this.teacherSessions[socketId] = teacherId;
  }

  getTeacherSession(socketId) {
    return this.teacherSessions[socketId];
  }

  cleanupTeacherSession(socketId) {
    delete this.teacherSessions[socketId];
  }

  getActiveRooms() {
    const activeRooms = {};

    for (const roomId in this.rooms) {
      if (this.rooms[roomId]) {
        const room = this.rooms[roomId];
        activeRooms[roomId] = {
          roomId: roomId,
          quizId: room.quizId,
          playerCount: Object.keys(room.players).length,
          players: Object.values(room.players),
          isActive: room.isActive,
          currentQuestionIndex: room.currentQuestionIndex,
          hostId: room.hostId,
          createdAt: room.createdAt || Date.now(),
        };
      }
    }

    return activeRooms;
  }

  startQuiz(roomId) {
    const room = this.rooms[roomId];
    if (!room) return false;

    // Clear any previous timer
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    // Reset all player states
    Object.values(room.players).forEach((player) => {
      player.answers = [];
      player.score = 0;
      player.streak = 0;
    });

    room.isActive = true;
    room.currentQuestionIndex = 0;
    room.questionStartTime = Date.now();
    room.questionEndedState = false;

    return true;
  }

  getCurrentQuestion(roomId) {
    const room = this.rooms[roomId];
    if (!room) return null;

    const currentQuestionId = room.questionOrder[room.currentQuestionIndex];
    return room.questions[currentQuestionId];
  }

  submitAnswer(roomId, socketId, answerId) {
    const room = this.rooms[roomId];
    if (!room || !room.isActive) {
      throw new Error("Cannot submit answer at this time");
    }

    const studentId = room.socketToStudent[socketId];
    if (!studentId) {
      throw new Error("Student not found in room");
    }

    const currentQuestionObj = this.getCurrentQuestion(roomId);
    const player = room.players[studentId];

    // Check if player has already answered
    const hasAlreadyAnswered = player.answers.some(
      (a) => a.questionId === currentQuestionObj.id
    );

    if (hasAlreadyAnswered) {
      throw new Error("You have already answered this question");
    }

    // Calculate time taken
    const timeTaken = Math.random() * currentQuestionObj.timeLimit;
    const isCorrect = parseInt(answerId) === currentQuestionObj.correctAnswer;

    // Store the answer
    player.answers.push({
      questionId: currentQuestionObj.id,
      answerId: parseInt(answerId),
      isCorrect,
      timeTaken,
    });

    // Calculate score
    if (isCorrect) {
      player.streak++;
      const timeBonus = 1 - timeTaken / currentQuestionObj.timeLimit;
      const streakMultiplier = Math.min(1 + player.streak * 0.1, 1.5);
      const pointsEarned = Math.floor(
        currentQuestionObj.points * timeBonus * streakMultiplier
      );
      player.score += pointsEarned;

      return {
        isCorrect,
        pointsEarned,
        streak: player.streak,
        totalScore: player.score,
      };
    } else {
      player.streak = 0;
      return {
        isCorrect,
        pointsEarned: 0,
        streak: player.streak,
        totalScore: player.score,
      };
    }
  }

  checkAllPlayersAnswered(roomId) {
    const room = this.rooms[roomId];
    if (!room) return false;

    const currentQuestionObj = this.getCurrentQuestion(roomId);
    return Object.values(room.players).every((p) => {
      return p.answers.some((a) => a.questionId === currentQuestionObj.id);
    });
  }

  moveToNextQuestion(roomId) {
    const room = this.rooms[roomId];
    if (!room || !room.isActive) return false;

    room.currentQuestionIndex++;
    const totalQuestions = room.questionOrder.length;

    // Check if quiz is completed
    if (room.currentQuestionIndex >= totalQuestions) {
      return { completed: true };
    }

    // Reset for new question
    room.questionStartTime = Date.now();
    room.questionEndedState = false;

    return { 
      completed: false, 
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions 
    };
  }

  endQuestion(roomId) {
    const room = this.rooms[roomId];
    if (!room) return null;

    room.questionEndedState = true;
    room.questionStartTime = null;

    const currentQuestionObj = this.getCurrentQuestion(roomId);

    // Ensure all players have an answer entry
    Object.values(room.players).forEach((player) => {
      const hasAnswered = player.answers.some(
        (a) => a.questionId === currentQuestionObj.id
      );
      if (!hasAnswered) {
        player.answers.push({
          questionId: currentQuestionObj.id,
          answerId: null,
          isCorrect: false,
          timeTaken: currentQuestionObj.timeLimit,
        });
      }
    });

    // Compile results
    const questionResults = {
      questionId: currentQuestionObj.id,
      question: currentQuestionObj.question,
      options: currentQuestionObj.options,
      correctAnswer: currentQuestionObj.correctAnswer,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questionOrder.length,
      playerAnswers: Object.values(room.players).map((p) => {
        const answer = p.answers.find(
          (a) => a.questionId === currentQuestionObj.id
        );
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

    // Clear timer
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }

    return questionResults;
  }

  setQuestionTimer(roomId, callback, timeLimit, io) {
    const room = this.rooms[roomId];
    if (!room) return;

    const timer = setTimeout(() => {
      const questionResults = callback(roomId, io);
      // The callback now handles emitting the event with the io instance
    }, timeLimit * 1000);
    
    room.timer = timer;
  }
}

// Export singleton instance
module.exports = new RoomService();
