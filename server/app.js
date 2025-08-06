const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const RoomManager = require('./roomManager');
const GameLogic = require('./gameLogic');

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());

// Log para verificar caminhos
  const fs = require('fs');
  const candidatePaths = [
    path.resolve(__dirname, 'public'),            // copied build during Render build
    path.resolve(__dirname, '..', '..', 'dist'),  // root/dist
    path.resolve(process.cwd(), '..', 'dist'),    // if cwd is server/
    path.resolve(process.cwd(), 'dist'),          // rarely used
    path.resolve(__dirname, '..', 'dist')         // monorepo-style (no /src)
  ];
  const resolved = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html')));
  const distPath = resolved || path.resolve(__dirname, 'public');
  const indexPath = path.join(distPath, 'index.html');
  console.log('Dist path candidates:', candidatePaths);
  console.log('Selected dist path (has index.html?):', distPath, fs.existsSync(indexPath));
  console.log('Index path:', indexPath);

app.use(express.static(distPath));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();
const gameLogic = new GameLogic();

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React app - this must be the last route
app.get('*', (req, res) => {
  res.sendFile(indexPath);
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (data) => {
    const { playerName } = data;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = roomManager.createRoom(roomId);
    const player = { id: socket.id, name: playerName, score: 0, answers: {}, isReady: false };
    room.players.push(player);
    room.hostId = socket.id;

    socket.join(roomId);
    socket.emit('roomCreated', { roomId, room });
    console.log(`Room ${roomId} created by ${playerName}`);
  });

  socket.on('joinRoom', (data) => {
    const { roomId, playerName } = data;
    try {
      const player = { id: socket.id, name: playerName, score: 0, answers: {}, isReady: false };
      const room = roomManager.joinRoom(roomId, player);
      socket.join(roomId);
      socket.emit('joinedRoom', { roomId, playerId: socket.id, room });
      io.to(roomId).emit('roomUpdated', {
        players: room.players,
        gameState: room.gameState,
        currentRound: room.currentRound
      });
      console.log(`${playerName} joined room ${roomId}`);
    } catch (error) {
      console.error(`Error joining room: ${error.message}`);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('startRound', (data) => {
    const { roomId } = data;
    try {
      const room = roomManager.getRoom(roomId);
      if (room && room.hostId === socket.id) {
        const letter = gameLogic.getRandomLetter();
        const roundData = roomManager.startRound(roomId, letter);
        io.to(roomId).emit('roundStarted', roundData);

        let timeLeft = 60;
        const timer = setInterval(() => {
          timeLeft--;
          io.to(roomId).emit('timeUpdate', timeLeft);

          if (timeLeft <= 0) {
            clearInterval(timer);
            const endData = roomManager.endRound(roomId);
            io.to(roomId).emit('roundEnded', endData);
          }
        }, 1000);

        room.timer = timer;
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('submitAnswers', (data) => {
    const { roomId, answers } = data;
    try {
      roomManager.submitAnswers(roomId, socket.id, answers);
      const room = roomManager.getRoom(roomId);
      io.to(roomId).emit('roomUpdated', room);

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        const allPlayersFinished = room.players.every(p => p.isReady);
        io.to(roomId).emit('playerFinished', {
          playerId: socket.id,
          playerName: player.name,
          allReady: allPlayersFinished
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('stopPressed', (data) => {
    const { roomId } = data;
    try {
      const room = roomManager.getRoom(roomId);
      if (room && room.timer) {
        clearInterval(room.timer);
        const endData = roomManager.endRound(roomId);
        io.to(roomId).emit('gameForceEnded', {
          playerId: socket.id,
          playerName: room.players.find(p => p.id === socket.id)?.name
        });
        io.to(roomId).emit('roundEnded', endData);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('voteWord', (data) => {
    const { roomId, playerId, category, vote } = data;
    try {
      roomManager.voteWord(roomId, playerId, category, vote);
      const room = roomManager.getRoom(roomId);
      io.to(roomId).emit('roomUpdated', room);

      if (roomManager.allVotesComplete(roomId)) {
        const scores = gameLogic.calculateScores(
          room.players,
          room.voting,
          room.currentLetter,
          room.categories
        );
        const updatedRoom = roomManager.updateScores(roomId, scores);
        io.to(roomId).emit('scoresCalculated', { 
          scores, 
          players: updatedRoom.players, 
          round: updatedRoom.currentRound 
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('updateCategories', (data) => {
    const { roomId, categories } = data;
    try {
      const room = roomManager.getRoom(roomId);
      if (room && room.hostId === socket.id) {
        roomManager.updateCategories(roomId, categories);
        io.to(roomId).emit('categoriesUpdated', { categories });
        io.to(roomId).emit('roomUpdated', roomManager.getRoom(roomId));
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('chatMessage', (data) => {
    const { roomId, message } = data;
    try {
      const room = roomManager.getRoom(roomId);
      const player = room?.players.find(p => p.id === socket.id);
      if (player) {
        io.to(roomId).emit('chatMessage', {
          playerId: socket.id,
          playerName: player.name,
          message,
          timestamp: new Date()
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    try {
      roomManager.removePlayer(socket.id);
      const rooms = roomManager.getAllRooms();
      rooms.forEach(room => {
        if (room.players.some(p => p.id === socket.id)) {
          io.to(room.id).emit('roomUpdated', room);
        }
      });
    } catch (error) {
      console.error('Error handling disconnect:', error.message);
    }
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor rodando na porta', PORT);
  console.log('Ambiente:', process.env.NODE_ENV || 'development');
  console.log('Servindo arquivos estáticos de:', distPath);
});