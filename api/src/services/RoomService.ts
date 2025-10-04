import { Question } from '../types/quiz';

interface Player {
  socketId: string | null;
  studentId: string;
  name: string;
  score: number;
  streak: number;
  answers: PlayerAnswer[];
}

interface PlayerAnswer {
  questionId: number;
  answerId: number | null;
  isCorrect: boolean;
  timeTaken: number;
}

interface Room {
  quizId: string;
  questions: Record<number, Question>;
  questionOrder: number[];
  players: Record<string, Player>;
  socketToStudent: Record<string, string>;
  studentHistory: Set<string>;
  isActive: boolean;
  currentQuestionIndex: number;
  results: Record<string, any>;
  hostId: string | null;
  teacherSessionId: string;
  createdAt: number;
  questionEndedState: boolean;
  timer?: NodeJS.Timeout | null;
  deletionTimer?: NodeJS.Timeout | null;
  questionStartTime?: number | null;
  isCompleted?: boolean;
  completedAt?: number;
}

interface QuestionSet {
  questions: Question[];
}

interface PlayerData {
  socketId: string;
  playerName: string;
  studentId: string;
}

interface AddPlayerResult {
  socketId: string | null;
  studentId: string;
  name: string;
  score: number;
  streak: number;
  answers: PlayerAnswer[];
}

interface RemovePlayerResult {
  studentId: string;
  removed: boolean;
}

interface ActiveRoom {
  roomId: string;
  quizId: string;
  playerCount: number;
  players: Player[];
  isActive: boolean;
  currentQuestionIndex: number;
  hostId: string | null;
  createdAt: number;
  quizName?: string; // Add this optional property
}

interface SubmitAnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  streak: number;
  totalScore: number;
}

interface NextQuestionResult {
  completed: boolean;
  currentQuestionIndex?: number;
  totalQuestions?: number;
}

interface QuestionResults {
  questionId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  playerAnswers: Array<{
    playerId: string;
    playerName: string;
    studentId: string;
    answerId: number | null;
    isCorrect: boolean;
    score: number;
    streak: number;
  }>;
}

class RoomService {
  private rooms: Record<string, Room> = {};
  private teacherSessions: Record<string, string> = {};

  public createRoom(quizId: string, teacherId: string, questionSet: QuestionSet): string {
    // Generate a unique 6-digit numeric room code
    let roomCode: string;
    do {
      roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.rooms[roomCode]);

    const roomId = roomCode;

    // Convert questions array to a map by id for consistency
    const questionsMap: Record<number, Question> = {};
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

  public getRoom(roomId: string): Room | undefined {
    return this.rooms[roomId];
  }

  public deleteRoom(roomId: string): boolean {
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

  public addPlayerToRoom(roomId: string, playerData: PlayerData): AddPlayerResult {
    const room = this.rooms[roomId];
    if (!room) {
      throw new Error('Room not found');
    }

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

  public removePlayerFromRoom(roomId: string, socketId: string): RemovePlayerResult | false {
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

  public updateTeacherSession(socketId: string, teacherId: string): void {
    this.teacherSessions[socketId] = teacherId;
  }

  public getTeacherSession(socketId: string): string | undefined {
    return this.teacherSessions[socketId];
  }

  public cleanupTeacherSession(socketId: string): void {
    delete this.teacherSessions[socketId];
  }

  public getActiveRooms(): Record<string, ActiveRoom> {
    const activeRooms: Record<string, ActiveRoom> = {};

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
          quizName: undefined, // Add this optional property
        };
      }
    }

    return activeRooms;
  }

  public getAllRooms(): Record<string, Room> {
    return this.rooms;
  }

  public startQuiz(roomId: string): boolean {
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

  public getCurrentQuestion(roomId: string): Question | null {
    const room = this.rooms[roomId];
    if (!room) return null;

    const currentQuestionId = room.questionOrder[room.currentQuestionIndex];
    return room.questions[currentQuestionId];
  }

  public submitAnswer(roomId: string, socketId: string, answerId: number): SubmitAnswerResult {
    const room = this.rooms[roomId];
    if (!room || !room.isActive) {
      throw new Error("Cannot submit answer at this time");
    }

    const studentId = room.socketToStudent[socketId];
    if (!studentId) {
      throw new Error("Student not found in room");
    }

    const currentQuestionObj = this.getCurrentQuestion(roomId);
    if (!currentQuestionObj) {
      throw new Error("No current question available");
    }

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
    const isCorrect = parseInt(answerId.toString()) === currentQuestionObj.correctAnswer;

    // Store the answer
    player.answers.push({
      questionId: currentQuestionObj.id,
      answerId: parseInt(answerId.toString()),
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

  public checkAllPlayersAnswered(roomId: string): boolean {
    const room = this.rooms[roomId];
    if (!room) return false;

    const currentQuestionObj = this.getCurrentQuestion(roomId);
    if (!currentQuestionObj) return false;

    return Object.values(room.players).every((p) => {
      return p.answers.some((a) => a.questionId === currentQuestionObj.id);
    });
  }

  public moveToNextQuestion(roomId: string): NextQuestionResult | false {
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

  public endQuestion(roomId: string): QuestionResults | null {
    const room = this.rooms[roomId];
    if (!room) return null;

    room.questionEndedState = true;
    room.questionStartTime = null;

    const currentQuestionObj = this.getCurrentQuestion(roomId);
    if (!currentQuestionObj) return null;

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
    const questionResults: QuestionResults = {
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
          playerId: p.socketId || p.studentId,
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

  public setQuestionTimer(roomId: string, callback: (roomId: string, io: any) => any, timeLimit: number, io: any): void {
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
export default new RoomService();
