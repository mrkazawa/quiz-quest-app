import { TypedSocket, TypedServer } from '../../types/socket';
import RoomService from '../../services/RoomService';
import HistoryService from '../../services/HistoryService';
import QuizService from '../../services/QuizService';
import logger from '../../utils/logger';

function register(socket: TypedSocket, io: TypedServer): void {
  // Teacher starts the quiz
  socket.on('start_quiz', (data) => {
    handleStartQuiz(socket, io, data);
  });

  // Player submits an answer
  socket.on('submit_answer', (data) => {
    handleSubmitAnswer(socket, io, data);
  });

  // Move to next question
  socket.on('next_question', (roomId) => {
    handleNextQuestion(socket, io, roomId);
  });

  // Get quiz rankings (for final results view)
  socket.on('get_quiz_rankings', (data) => {
    handleGetQuizRankings(socket, io, data);
  });
}

function handleStartQuiz(socket: TypedSocket, io: TypedServer, data: any): void {
  const { roomId } = data;
  
  const room = RoomService.getRoom(roomId);
  if (!room || room.hostId !== socket.id) {
    socket.emit('start_error', 'Not authorized to start quiz');
    return;
  }

  // Start the quiz
  const started = RoomService.startQuiz(roomId);
  if (!started) {
    socket.emit('start_error', 'Failed to start quiz');
    return;
  }

  const currentQuestionObj = RoomService.getCurrentQuestion(roomId);
  if (!currentQuestionObj) {
    socket.emit('start_error', 'No questions available');
    return;
  }
  
  io.to(roomId).emit('quiz_started', { roomId });

  // Send question to all students
  Object.values(room.players).forEach((player: any) => {
    if (player.socketId) {
      io.to(player.socketId).emit('new_question', {
        question: currentQuestionObj.question,
        options: currentQuestionObj.options,
        timeLimit: currentQuestionObj.timeLimit,
        remainingTime: currentQuestionObj.timeLimit,
        questionId: currentQuestionObj.id,
        currentScore: player.score,
        currentStreak: player.streak,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: room.questionOrder.length,
        hasAnswered: false,
        questionExpired: false,
      });
    }
  });

  // Send to teacher
  if (room.hostId) {
    io.to(room.hostId).emit('new_question', {
      question: currentQuestionObj.question,
      options: currentQuestionObj.options,
      timeLimit: currentQuestionObj.timeLimit,
      remainingTime: currentQuestionObj.timeLimit,
      questionId: currentQuestionObj.id,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.questionOrder.length,
    });
  }

  logger.info(`Quiz started in room ${roomId}`);

  // Set timer for question
  RoomService.setQuestionTimer(roomId, (roomId: string, ioInstance: any) => endQuestion(roomId, ioInstance), currentQuestionObj.timeLimit, io);
}

function handleSubmitAnswer(socket: TypedSocket, io: TypedServer, data: any): void {
  const { roomId, answerId } = data;

  try {
    const result = RoomService.submitAnswer(roomId, socket.id, answerId);
    
    socket.emit('answer_result', result);

    logger.debug(`Answer submitted in room ${roomId} by socket ${socket.id}`);

    // Check if all players answered
    const allAnswered = RoomService.checkAllPlayersAnswered(roomId);
    if (allAnswered) {
      const room = RoomService.getRoom(roomId);
      if (room && room.timer) {
        clearTimeout(room.timer);
      }
      // Pass io instance to endQuestion
      endQuestion(roomId, io);
    }

  } catch (error) {
    logger.error('Error submitting answer:', error);
    socket.emit('answer_error', (error as Error).message);
  }
}

function handleNextQuestion(socket: TypedSocket, io: TypedServer, roomId: string): void {
  logger.debug(`Teacher advancing to next question in room ${roomId}`);
  
  const room = RoomService.getRoom(roomId);
  if (!room) {
    socket.emit('next_error', 'Room not found');
    return;
  }

  // Check authorization
  if (room.hostId !== socket.id) {
    // Try auto-correct for same teacher session
    const socketTeacherId = RoomService.getTeacherSession(socket.id);
    if (socketTeacherId && room.teacherSessionId === socketTeacherId) {
      room.hostId = socket.id;
    } else {
      socket.emit('next_error', 'Not authorized to advance quiz');
      return;
    }
  }

  moveToNextQuestion(roomId, io);
}

function endQuestion(roomId: string, io: TypedServer): any {
  const room = RoomService.getRoom(roomId);
  if (!room) return;

  const questionResults = RoomService.endQuestion(roomId);
  if (!questionResults) return;

  // Emit question ended event to all players in the room
  io.to(roomId).emit('question_ended', questionResults);

  logger.debug(`Question ended in room ${roomId}`);
  
  return questionResults;
}

function moveToNextQuestion(roomId: string, io: TypedServer): void {
  const result = RoomService.moveToNextQuestion(roomId);
  if (!result) {
    logger.warn(`Cannot move to next question in room ${roomId}`);
    return;
  }

  if (result.completed) {
    logger.info(`Quiz completed in room ${roomId}`);
    endQuiz(roomId, io);
    return;
  }

  const room = RoomService.getRoom(roomId);
  if (!room) {
    logger.warn(`Room ${roomId} not found when moving to next question`);
    return;
  }

  const nextQuestionObj = RoomService.getCurrentQuestion(roomId);
  if (!nextQuestionObj) {
    logger.warn(`Next question not found for room ${roomId}`);
    return;
  }

  const currentIndex = result.currentQuestionIndex ?? room.currentQuestionIndex;
  logger.info(`Moving to question ${currentIndex + 1}/${result.totalQuestions} in room ${roomId}`);

  // Send to all students
  Object.values(room.players).forEach((player: any) => {
    if (player.socketId) {
      io.to(player.socketId).emit('new_question', {
        question: nextQuestionObj.question,
        options: nextQuestionObj.options,
        timeLimit: nextQuestionObj.timeLimit,
        remainingTime: nextQuestionObj.timeLimit,
        questionId: nextQuestionObj.id,
        currentScore: player.score,
        currentStreak: player.streak,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: result.totalQuestions,
        hasAnswered: false,
        questionExpired: false,
      });
    }
  });

  // Send to teacher
  if (room.hostId) {
    io.to(room.hostId).emit('new_question', {
      question: nextQuestionObj.question,
      options: nextQuestionObj.options,
      timeLimit: nextQuestionObj.timeLimit,
      remainingTime: nextQuestionObj.timeLimit,
      questionId: nextQuestionObj.id,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: result.totalQuestions,
    });
  }

  // Set timer for new question
  RoomService.setQuestionTimer(roomId, (roomId: string, ioInstance: any) => endQuestion(roomId, ioInstance), nextQuestionObj.timeLimit, io);
}

function endQuiz(roomId: string, io: TypedServer): void {
  logger.info(`Starting endQuiz for room ${roomId}`);
  
  const room = RoomService.getRoom(roomId);
  if (!room) {
    logger.warn(`Room ${roomId} not found in endQuiz`);
    return;
  }

  logger.debug(`Room ${roomId} has ${Object.keys(room.players).length} players`);
  
  room.isActive = false;

  // Get final rankings
  const rankings = Object.values(room.players)
    .sort((a: any, b: any) => b.score - a.score)
    .map((p: any, index: number) => ({
      rank: index + 1,
      playerId: p.socketId,
      playerName: p.name,
      studentId: p.studentId,
      score: p.score,
    }));

  logger.debug(`Generated ${rankings.length} rankings for room ${roomId}`);

  // Save to history
  const quizSet = QuizService.getQuizById(room.quizId);
  const quizName = quizSet ? quizSet.name : room.quizId;
  
  logger.debug(`Saving history for room ${roomId} with quiz: ${quizName}`);
  const historyResult = HistoryService.saveQuizHistory(roomId, room, quizName);
  logger.verbose('History save result:', historyResult);

  // Send quiz ended event with minimal info (same as original)
  io.to(roomId).emit('quiz_ended', { historyId: roomId });

  // Send quiz rankings separately for final results
  const quizRankings = {
    id: roomId,
    roomId: roomId,
    quizId: room.quizId,
    quizName: quizName,
    dateCompleted: new Date().toISOString(),
    playerCount: Object.keys(room.players).length,
    rankings: rankings,
  };

  logger.verbose('Sending quiz_rankings to room:', { roomId, quizRankings });
  io.to(roomId).emit('quiz_rankings', quizRankings);

  logger.info(`Quiz ended in room ${roomId}, saved as history ${roomId}`);

  // Mark room as completed
  room.isCompleted = true;
  room.completedAt = Date.now();

  // Set cleanup timer
  room.deletionTimer = setTimeout(() => {
    logger.debug(`Cleaning up completed room ${roomId}`);
    RoomService.deleteRoom(roomId);
  }, 5 * 60 * 1000); // 5 minutes
}

function handleGetQuizRankings(socket: TypedSocket, io: TypedServer, data: any): void {
  const { roomId } = data;

  // Check if room exists (active or completed)
  let room = RoomService.getRoom(roomId);
  let rankings = null;

  if (room && room.isCompleted) {
    // Room is completed, get rankings from room
    rankings = Object.values(room.players)
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
  } else {
    // Check history if room doesn't exist
    const historyItem = HistoryService.getHistoryById(roomId);
    if (historyItem) {
      socket.emit('quiz_rankings', historyItem);
    } else {
      socket.emit('rankings_error', 'Quiz results not found');
    }
  }

  logger.debug(`Sent quiz rankings for room ${roomId}`);
}

export default {
  register
};
