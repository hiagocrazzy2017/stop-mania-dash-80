class GameLogic {
  constructor() {
    this.letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X'];
  }

  getRandomLetter() {
    return this.letters[Math.floor(Math.random() * this.letters.length)];
  }

  prepareVotingData(players, currentLetter, categories) {
    const votingData = {};
    
    categories.forEach(category => {
      votingData[category.id] = {};
      
      players.forEach(player => {
        const answer = player.answers[category.id];
        if (answer && answer.trim()) {
          votingData[category.id][player.id] = {
            playerName: player.name,
            answer: answer.trim(),
            votes: {},
            needsVoting: true
          };
        }
      });
    });

    return votingData;
  }

  calculateScores(players, voting, currentLetter, categories) {
    const scores = [];
    
    players.forEach(player => {
      const playerScore = {
        playerId: player.id,
        playerName: player.name,
        roundScore: 0,
        categoryScores: {}
      };

      categories.forEach(category => {
        const answer = player.answers[category.id];
        let points = 0;

        if (answer && answer.trim()) {
          // Verificar se a palavra foi aceita na votação
          const categoryVoting = voting[category.id];
          const playerVoting = categoryVoting && categoryVoting[player.id];
          
          if (playerVoting && playerVoting.result === 'accepted') {
            // Verificar se é palavra única ou repetida
            const sameAnswers = players.filter(p => 
              p.answers[category.id] && 
              p.answers[category.id].toLowerCase().trim() === answer.toLowerCase().trim() &&
              voting[category.id] && 
              voting[category.id][p.id] && 
              voting[category.id][p.id].result === 'accepted'
            );

            if (sameAnswers.length === 1) {
              points = 10; // Palavra única
            } else {
              points = 5;  // Palavra repetida mas aceita
            }
          } else if (playerVoting && playerVoting.result === 'rejected') {
            points = 0; // Palavra rejeitada
          } else {
            // Se não houve votação (todos os outros jogadores deixaram vazio)
            const otherPlayersWithAnswers = players.filter(p => 
              p.id !== player.id && 
              p.answers[category.id] && 
              p.answers[category.id].trim()
            );
            
            if (otherPlayersWithAnswers.length === 0) {
              points = 10; // Única palavra da categoria
            } else {
              points = 5; // Default se não houve votação
            }
          }

          // Verificar se começa com a letra correta
          if (!answer.toLowerCase().startsWith(currentLetter.toLowerCase())) {
            points = 0;
          }
        }

        playerScore.categoryScores[category.id] = points;
        playerScore.roundScore += points;
      });

      scores.push(playerScore);
    });

    return scores;
  }

  validateAnswer(answer, letter) {
    if (!answer || !answer.trim()) return false;
    return answer.toLowerCase().startsWith(letter.toLowerCase());
  }

  getGameStats(players) {
    return {
      totalPlayers: players.length,
      averageScore: players.reduce((sum, p) => sum + p.score, 0) / players.length,
      highestScore: Math.max(...players.map(p => p.score)),
      completedAnswers: players.reduce((sum, p) => 
        sum + Object.values(p.answers).filter(a => a && a.trim()).length, 0
      )
    };
  }
}

module.exports = GameLogic;