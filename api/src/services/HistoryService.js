class HistoryService {
  constructor() {
    this.quizHistory = {};
  }

  saveQuizHistory(roomId, roomData, quizName) {
    console.log(`💾 Saving quiz history for room ${roomId} with ${Object.keys(roomData.players).length} players`);
    
    // Generate final rankings
    const rankings = Object.values(roomData.players)
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
    const detailedResults = Object.values(roomData.players).map((player) => {
      let runningScore = 0;
      let runningStreak = 0;

      const processedAnswers = player.answers.map((answer) => {
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

  getAllHistory() {
    return Object.values(this.quizHistory).sort((a, b) => {
      return new Date(b.dateCompleted) - new Date(a.dateCompleted);
    });
  }

  getHistoryById(historyId) {
    console.log(`🔍 Looking for history ID: ${historyId}`);
    console.log(`📋 Available histories:`, Object.keys(this.quizHistory));
    return this.quizHistory[historyId];
  }

  deleteHistory(historyId) {
    if (this.quizHistory[historyId]) {
      delete this.quizHistory[historyId];
      return true;
    }
    return false;
  }
}

// Export singleton instance
module.exports = new HistoryService();
