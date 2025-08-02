const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const RoomManager = require('./roomManager');
const GameLogic = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();
const gameLogic = new GameLogic();

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);

  // Entrar em uma sala
  socket.on('joinRoom', ({ roomId, playerName }) => {
    try {
      const room = roomManager.joinRoom(roomId, {
        id: socket.id,
        name: playerName,
        score: 0,
        answers: {},
        isReady: false
      });

      socket.join(roomId);
      socket.roomId = roomId;
      socket.playerName = playerName;
      socket.playerId = socket.id;

      // Enviar estado da sala para todos
      io.to(roomId).emit('roomUpdated', {
        players: room.players,
        gameState: room.gameState,
        currentRound: room.currentRound
      });

      socket.emit('joinedRoom', { 
        roomId, 
        playerId: socket.id,
        room: room
      });

      console.log(`${playerName} entrou na sala ${roomId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Criar nova sala
  socket.on('createRoom', ({ playerName }) => {
    const roomId = uuidv4().substring(0, 6).toUpperCase();
    const room = roomManager.createRoom(roomId);
    
    roomManager.joinRoom(roomId, {
      id: socket.id,
      name: playerName,
      score: 0,
      answers: {},
      isReady: false
    });

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = playerName;
    socket.playerId = socket.id;

    socket.emit('roomCreated', { roomId, room });
    console.log(`Sala ${roomId} criada por ${playerName}`);
  });

  // Iniciar nova rodada
  socket.on('startRound', () => {
    const roomId = socket.roomId;
    if (!roomId) return;

    try {
      const room = roomManager.getRoom(roomId);
      const letter = gameLogic.getRandomLetter();
      
      room.currentLetter = letter;
      room.gameState = 'playing';
      room.roundStartTime = Date.now();
      room.timeLeft = 60;
      
      // Reset answers for new round
      room.players.forEach(player => {
        player.answers = {};
        player.isReady = false;
      });

      io.to(roomId).emit('roundStarted', {
        letter,
        timeLeft: 60,
        round: room.currentRound
      });

      // Start countdown timer
      room.timer = setInterval(() => {
        room.timeLeft--;
        io.to(roomId).emit('timeUpdate', room.timeLeft);
        
        if (room.timeLeft <= 0) {
          clearInterval(room.timer);
          finishRound(roomId);
        }
      }, 1000);

      console.log(`Rodada iniciada na sala ${roomId} com letra ${letter}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Enviar respostas
  socket.on('submitAnswers', ({ answers }) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    try {
      const room = roomManager.getRoom(roomId);
      const player = room.players.find(p => p.id === socket.id);
      
      if (player) {
        player.answers = answers;
        player.isReady = true;

        // Verificar se todos terminaram
        const allReady = room.players.every(p => p.isReady);
        
        io.to(roomId).emit('playerFinished', {
          playerId: socket.id,
          playerName: player.name,
          allReady
        });

        if (allReady) {
          clearInterval(room.timer);
          finishRound(roomId);
        }
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // STOP button pressed
  socket.on('stopPressed', () => {
    const roomId = socket.roomId;
    if (!roomId) return;

    try {
      const room = roomManager.getRoom(roomId);
      if (room.timer) {
        clearInterval(room.timer);
      }
      finishRound(roomId);
      
      io.to(roomId).emit('gameForceEnded', {
        playerName: socket.playerName
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Votar em palavra
  socket.on('voteWord', ({ category, playerId, vote }) => {
    const roomId = socket.roomId;
    if (!roomId) return;

    try {
      const room = roomManager.getRoom(roomId);
      if (!room.voting) room.voting = {};
      if (!room.voting[category]) room.voting[category] = {};
      if (!room.voting[category][playerId]) room.voting[category][playerId] = {};
      
      room.voting[category][playerId][socket.id] = vote;

      // Verificar se todos votaram
      const totalVoters = room.players.length - 1; // Excluir o próprio jogador
      const currentVotes = Object.keys(room.voting[category][playerId]).length;
      
      if (currentVotes >= totalVoters) {
        // Calcular resultado da votação
        const votes = Object.values(room.voting[category][playerId]);
        const acceptVotes = votes.filter(v => v === 'accept').length;
        const rejectVotes = votes.filter(v => v === 'reject').length;
        
        room.voting[category][playerId].result = acceptVotes > rejectVotes ? 'accepted' : 'rejected';
      }

      io.to(roomId).emit('voteUpdated', {
        category,
        playerId,
        votes: room.voting[category][playerId]
      });

      // Verificar se todas as votações terminaram
      checkAllVotingComplete(roomId);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Desconexão
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
    
    if (socket.roomId) {
      try {
        roomManager.removePlayer(socket.roomId, socket.id);
        const room = roomManager.getRoom(socket.roomId);
        
        if (room) {
          io.to(socket.roomId).emit('playerLeft', {
            playerId: socket.id,
            playerName: socket.playerName,
            remainingPlayers: room.players
          });
        }
      } catch (error) {
        console.log('Erro ao remover jogador:', error.message);
      }
    }
  });

  function finishRound(roomId) {
    try {
      const room = roomManager.getRoom(roomId);
      room.gameState = 'voting';
      
    // Preparar dados para votação
    const votingData = gameLogic.prepareVotingData(room.players, room.currentLetter, room.categories);
    room.voting = {};
    
    io.to(roomId).emit('roundEnded', {
      votingData,
      players: room.players
    });
    } catch (error) {
      console.log('Erro ao finalizar rodada:', error.message);
    }
  }

  function checkAllVotingComplete(roomId) {
    try {
      const room = roomManager.getRoom(roomId);
      
      let allVotingComplete = true;
      
      for (const category of room.categories) {
        for (const player of room.players) {
          const answer = player.answers[category.id];
          if (answer && answer.trim()) {
            // Verificar se todos os outros jogadores votaram
            const otherPlayers = room.players.filter(p => p.id !== player.id);
            const votes = room.voting[category.id]?.[player.id];
            
            if (!votes || Object.keys(votes).length < otherPlayers.length) {
              allVotingComplete = false;
              break;
            }
          }
        }
        if (!allVotingComplete) break;
      }

      if (allVotingComplete) {
        // Calcular pontuações finais
        const scores = gameLogic.calculateScores(room.players, room.voting, room.currentLetter, room.categories);
        
        // Atualizar scores dos jogadores
        room.players.forEach(player => {
          const playerScore = scores.find(s => s.playerId === player.id);
          if (playerScore) {
            player.score += playerScore.roundScore;
          }
        });

        room.currentRound++;
        room.gameState = 'waiting';

        io.to(roomId).emit('scoresCalculated', {
          scores,
          players: room.players,
          round: room.currentRound - 1
        });
      }
    } catch (error) {
      console.log('Erro ao verificar votação:', error.message);
    }
  }

  // Gerenciar categorias (apenas para o host)
  socket.on('updateCategories', ({ categories }) => {
    try {
      const room = roomManager.getRoom(socket.roomId);
      
      // Verificar se é o host
      if (room.hostId !== socket.id) {
        socket.emit('error', { message: 'Apenas o criador da sala pode gerenciar categorias' });
        return;
      }

      // Atualizar categorias
      roomManager.updateCategories(socket.roomId, categories);
      
      // Notificar todos na sala
      io.to(socket.roomId).emit('categoriesUpdated', { categories });
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('chatMessage', ({ message }) => {
    if (socket.roomId && socket.playerName) {
      io.to(socket.roomId).emit('chatMessage', {
        message,
        playerId: socket.id,
        playerName: socket.playerName,
        timestamp: new Date()
      });
    }
  });

  // Mensagem de boas-vindas
  socket.emit('chatMessage', {
    message: 'Conectado ao servidor do STOP! 🎮',
    playerId: 'server',
    playerName: 'Sistema',
    timestamp: new Date()
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});