const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const RoomManager = require('./roomManager');
const GameLogic = require('./gameLogic');

const app = express();
const server = createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://stop-game-frontend.onrender.com'] 
    : ['http://localhost:8080', 'http://localhost:5173'],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://stop-game-frontend.onrender.com'] 
      : ['http://localhost:8080', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const roomManager = new RoomManager();
const gameLogic = new GameLogic();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (data) => {
    const { playerName } = data;
    const room = roomManager.createRoom(playerName, socket.id);
    socket.join(room.id);
    socket.emit('roomCreated', { roomId: room.id, isHost: true });
    socket.emit('joinedRoom', room);
    console.log(`Room ${room.id} created by ${playerName}`);
  });

  socket.on('joinRoom', (data) => {
    const { roomId, playerName } = data;
    try {
      const room = roomManager.joinRoom(roomId, playerName, socket.id);
      socket.join(roomId);
      socket.emit('joinedRoom', room);
      io.to(roomId).emit('roomUpdated', room);
      console.log(`${playerName} joined room ${roomId}`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('startRound', (data) => {
    const { roomId } = data;
    try {
      const room = roomManager.getRoom(roomId);
      if (room && room.host === socket.id) {
        const letter = gameLogic.getRandomLetter();
        const roundData = roomManager.startRound(roomId, letter);
        io.to(roomId).emit('roundStarted', roundData);
        
        // Start timer
        let timeLeft = 60;
        const timer = setInterval(() => {
          timeLeft--;
          io.to(roomId).emit('timeUpdate', { timeLeft });
          
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
      
      // Check if player finished
      const player = room.players.find(p => p.id === socket.id);
      if (player && player.finished) {
        io.to(roomId).emit('playerFinished', { 
          playerId: socket.id, 
          playerName: player.name 
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
      
      // Check if all votes are complete
      if (roomManager.allVotesComplete(roomId)) {
        const scores = gameLogic.calculateScores(room);
        roomManager.updateScores(roomId, scores);
        io.to(roomId).emit('scoresCalculated', { scores });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('updateCategories', (data) => {
    const { roomId, categories } = data;
    try {
      const room = roomManager.getRoom(roomId);
      if (room && room.host === socket.id) {
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
      // Notify remaining players in rooms
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});