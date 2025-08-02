class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId) {
    const room = {
      id: roomId,
      players: [],
      gameState: 'waiting', // waiting, playing, voting, results
      currentRound: 1,
      currentLetter: '',
      timeLeft: 60,
      timer: null,
      voting: {},
      roundStartTime: null,
      maxPlayers: 8,
      hostId: null,
      categories: [
        { id: 'nome', label: 'Nome', icon: '👤' },
        { id: 'animal', label: 'Animal', icon: '🐾' },
        { id: 'cor', label: 'Cor', icon: '🎨' },
        { id: 'objeto', label: 'Objeto', icon: '📦' },
        { id: 'filme', label: 'Filme', icon: '🎬' },
        { id: 'cep', label: 'CEP', icon: '📍' },
        { id: 'comida', label: 'Comida', icon: '🍕' },
        { id: 'profissao', label: 'Profissão', icon: '💼' }
      ]
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId, player) {
    let room = this.rooms.get(roomId);
    
    if (!room) {
      room = this.createRoom(roomId);
    }

    // Verificar se a sala está cheia
    if (room.players.length >= room.maxPlayers) {
      throw new Error('Sala está cheia');
    }

    // Verificar se já existe um jogador com esse nome
    const existingPlayer = room.players.find(p => p.name === player.name);
    if (existingPlayer) {
      throw new Error('Já existe um jogador com esse nome na sala');
    }

    // Se é o primeiro jogador, ele vira host
    if (room.players.length === 0) {
      room.hostId = player.id;
    }

    room.players.push(player);
    return room;
  }

  removePlayer(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter(p => p.id !== playerId);
    
    // Se a sala ficar vazia, remove ela
    if (room.players.length === 0) {
      if (room.timer) {
        clearInterval(room.timer);
      }
      this.rooms.delete(roomId);
      return null;
    }

    return room;
  }

  getRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Sala não encontrada');
    }
    return room;
  }

  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  getRoomStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: Array.from(this.rooms.values()).reduce((sum, room) => sum + room.players.length, 0)
    };
  }

  updateCategories(roomId, categories) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Sala não encontrada');
    }
    room.categories = categories;
    return room;
  }
}

module.exports = RoomManager;