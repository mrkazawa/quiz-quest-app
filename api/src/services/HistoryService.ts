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

interface Ranking {
  rank: number;
  playerId: string | null;
  playerName: string;
  studentId: string;
  score: number;
}

interface DetailedPlayerResult {
  studentId: string;
  playerName: string;
  finalScore: number;
  answers: DetailedAnswer[];
}

interface DetailedAnswer {
  questionId: number;
  answerId: number | null;
  answerText: string;
  isCorrect: boolean;
  timeTaken: number;
  streakAfter: number;
  scoreAfter: number;
}

export interface QuizHistory {
  id: string;
  roomId: string;
  quizId: string;
  quizName: string;
  dateCompleted: string;
  playerCount: number;
  rankings: Ranking[];
  detailedResults: DetailedPlayerResult[];
}

interface RoomData {
  players: Record<string, Player>;
  questions: Record<number, any>;
  quizId: string;
}

/**
 * HistoryService - Manages quiz completion history and results
 * Supports both production use and in-memory testing
 */
export class HistoryService {
  private quizHistory: Record<string, QuizHistory> = {};

  constructor() {
    // No initialization needed - history is stored on demand
  }

  public saveQuizHistory(roomId: string, roomData: RoomData, quizName: string): QuizHistory {
    console.log(`💾 Saving quiz history for room ${roomId} with ${Object.keys(roomData.players).length} players`);
    
    // Generate final rankings
    const rankings: Ranking[] = Object.values(roomData.players)
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        rank: index + 1,
        playerId: p.socketId,
        playerName: p.name,
        studentId: p.studentId,
        score: p.score,
      }));

    console.log(`📊 Generated ${rankings.length} rankings for room ${roomId}`);

    // Create detailed results with question-by-question data
    const detailedResults: DetailedPlayerResult[] = Object.values(roomData.players).map((player) => {
      let runningScore = 0;
      let runningStreak = 0;

      const processedAnswers: DetailedAnswer[] = player.answers.map((answer) => {
        const questionObj = roomData.questions[answer.questionId];
        const answerText =
          answer.answerId !== null
            ? questionObj.options[answer.answerId]
            : "No Answer";

        // Update running totals
        if (answer.isCorrect) {
          runningStreak++;
          const timeBonus = 1 - answer.timeTaken / questionObj.timeLimit;
          const streakMultiplier = Math.min(1 + runningStreak * 0.1, 1.5);
          const pointsEarned = Math.floor(
            questionObj.points * timeBonus * streakMultiplier
          );
          runningScore += pointsEarned;
        } else {
          runningStreak = 0;
        }

        return {
          questionId: answer.questionId,
          answerId: answer.answerId,
          answerText: answerText,
          isCorrect: answer.isCorrect,
          timeTaken: answer.timeTaken,
          streakAfter: runningStreak,
          scoreAfter: runningScore,
        };
      });

      return {
        studentId: player.studentId,
        playerName: player.name,
        finalScore: player.score,
        answers: processedAnswers,
      };
    });

    // Save to history
    this.quizHistory[roomId] = {
      id: roomId,
      roomId: roomId,
      quizId: roomData.quizId,
      quizName: quizName,
      dateCompleted: new Date().toISOString(),
      playerCount: Object.keys(roomData.players).length,
      rankings: rankings,
      detailedResults: detailedResults,
    };

    console.log(`✅ Quiz history saved for room ${roomId} (${quizName})`);
    console.log(`📋 Current history entries:`, Object.keys(this.quizHistory));
    
    return this.quizHistory[roomId];
  }

  public getAllHistory(): QuizHistory[] {
    return Object.values(this.quizHistory).sort((a, b) => {
      return new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime();
    });
  }

  public getHistoryById(historyId: string): QuizHistory | undefined {
    console.log(`🔍 Looking for history ID: ${historyId}`);
    console.log(`📋 Available histories:`, Object.keys(this.quizHistory));
    return this.quizHistory[historyId];
  }

  public deleteHistory(historyId: string): boolean {
    if (this.quizHistory[historyId]) {
      delete this.quizHistory[historyId];
      return true;
    }
    return false;
  }

  /**
   * Get count of history entries (useful for testing and monitoring)
   */
  public getHistoryCount(): number {
    return Object.keys(this.quizHistory).length;
  }

  /**
   * Clear all history from memory (useful for testing)
   */
  public clearAllHistory(): void {
    this.quizHistory = {};
  }

  /**
   * Cleanup resources (useful for testing)
   */
  public cleanup(): void {
    this.clearAllHistory();
  }
}

// Export singleton instance
export default new HistoryService();
