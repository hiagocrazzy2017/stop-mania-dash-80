import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

interface Player {
  id: string;
  name: string;
  score: number;
  answers: Record<string, string>;
  isReady: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: string;
}

interface GameState {
  roomId: string | null;
  playerId: string | null;
  players: Player[];
  gameState: 'waiting' | 'playing' | 'voting' | 'results';
  currentRound: number;
  currentLetter: string;
  timeLeft: number;
  isConnected: boolean;
  votingData: any;
  chatMessages: ChatMessage[];
  categories: Category[];
  isHost: boolean;
}

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<GameState>({
    roomId: null,
    playerId: null,
    players: [],
    gameState: 'waiting',
    currentRound: 1,
    currentLetter: '',
    timeLeft: 60,
    isConnected: false,
    votingData: {},
    chatMessages: [],
    categories: [
      { id: 'nome', label: 'Nome', icon: '👤' },
      { id: 'animal', label: 'Animal', icon: '🐾' },
      { id: 'cor', label: 'Cor', icon: '🎨' },
      { id: 'objeto', label: 'Objeto', icon: '📦' },
      { id: 'filme', label: 'Filme', icon: '🎬' },
      { id: 'cep', label: 'CEP', icon: '📍' },
      { id: 'comida', label: 'Comida', icon: '🍕' },
      { id: 'profissao', label: 'Profissão', icon: '💼' }
    ],
    isHost: false
  });

  useEffect(() => {
    // Determinar URL do servidor baseado no ambiente
    const serverUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : 'https://stop-game-fullstack-backend.onrender.com';
    
    console.log('Tentando conectar ao servidor:', serverUrl);
    
    // Conectar ao servidor
    socketRef.current = io(serverUrl, {
      timeout: 10000, // Aumentar timeout para 10s
      forceNew: true
    });
    const socket = socketRef.current;

    // Timeout para modo local se não conseguir conectar
    const connectionTimeout = setTimeout(() => {
      console.log('Servidor não disponível - funcionando em modo local');
      setGameState(prev => ({ ...prev, isConnected: true }));
      toast({
        title: "Modo local ativo",
        description: "Para entrar em salas reais, inicie o servidor backend.",
        variant: "destructive"
      });
    }, 10000); // Aumentar timeout para 10s

    socket.on('connect', () => {
      clearTimeout(connectionTimeout);
      setGameState(prev => ({ ...prev, isConnected: true }));
      toast({
        title: "Conectado ao servidor",
        description: "Você está pronto para jogar!",
      });
    });

    socket.on('disconnect', () => {
      setGameState(prev => ({ ...prev, isConnected: false }));
      toast({
        title: "Desconectado",
        description: "Tentando reconectar...",
        variant: "destructive"
      });
    });

    socket.on('roomCreated', ({ roomId, room }) => {
      setGameState(prev => ({
        ...prev,
        roomId,
        players: room.players,
        currentRound: room.currentRound,
        categories: room.categories || prev.categories,
        isHost: true
      }));
      toast({
        title: "Sala criada!",
        description: `Código da sala: ${roomId}`,
      });
    });

    socket.on('joinedRoom', ({ roomId, playerId, room }) => {
      setGameState(prev => ({
        ...prev,
        roomId,
        playerId,
        players: room.players,
        gameState: room.gameState,
        currentRound: room.currentRound,
        categories: room.categories || prev.categories,
        isHost: room.hostId === playerId
      }));
      toast({
        title: "Entrou na sala!",
        description: `Sala: ${roomId}`,
      });
    });

    socket.on('roomUpdated', ({ players, gameState: newGameState, currentRound }) => {
      setGameState(prev => ({
        ...prev,
        players,
        gameState: newGameState,
        currentRound
      }));
    });

    socket.on('roundStarted', ({ letter, timeLeft, round }) => {
      setGameState(prev => ({
        ...prev,
        currentLetter: letter,
        timeLeft,
        gameState: 'playing',
        currentRound: round
      }));
      toast({
        title: `Rodada ${round} iniciada!`,
        description: `Letra sorteada: ${letter}`,
      });
    });

    socket.on('timeUpdate', (timeLeft) => {
      setGameState(prev => ({ ...prev, timeLeft }));
    });

    socket.on('playerFinished', ({ playerName, allReady }) => {
      toast({
        title: `${playerName} terminou!`,
        description: allReady ? "Todos terminaram!" : "Aguardando outros jogadores...",
      });
    });

    socket.on('roundEnded', ({ votingData, players }) => {
      setGameState(prev => ({
        ...prev,
        gameState: 'voting',
        votingData,
        players
      }));
    });

    socket.on('voteUpdated', ({ category, playerId, votes }) => {
      setGameState(prev => ({
        ...prev,
        votingData: {
          ...prev.votingData,
          [category]: {
            ...prev.votingData[category],
            [playerId]: {
              ...prev.votingData[category][playerId],
              votes
            }
          }
        }
      }));
    });

    socket.on('scoresCalculated', ({ scores, players, round }) => {
      setGameState(prev => ({
        ...prev,
        players,
        gameState: 'results',
        currentRound: round + 1
      }));
      
      toast({
        title: "Pontuação calculada!",
        description: "Veja os resultados da rodada.",
      });
    });

    socket.on('gameForceEnded', ({ playerName }) => {
      toast({
        title: "STOP!",
        description: `${playerName} gritou STOP!`,
        variant: "default"
      });
    });

    socket.on('playerLeft', ({ playerName, remainingPlayers }) => {
      setGameState(prev => ({
        ...prev,
        players: remainingPlayers
      }));
      toast({
        title: "Jogador saiu",
        description: `${playerName} deixou a sala`,
        variant: "destructive"
      });
    });

    socket.on('error', ({ message }) => {
      toast({
        title: "Erro",
        description: message,
        variant: "destructive"
      });
    });

    socket.on('chatMessage', ({ message, playerId, playerName, timestamp }) => {
      setGameState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, {
          id: Math.random().toString(36),
          playerId,
          playerName,
          message,
          timestamp: new Date(timestamp)
        }]
      }));
    });

    socket.on('categoriesUpdated', ({ categories }) => {
      setGameState(prev => ({
        ...prev,
        categories
      }));
      toast({
        title: "Categorias atualizadas!",
        description: "O host modificou as categorias do jogo.",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [toast]);

  const createRoom = (playerName: string) => {
    if (socketRef.current?.connected) {
      socketRef.current?.emit('createRoom', { playerName });
    } else {
      // Modo local - simular criação de sala
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const playerId = Math.random().toString(36).substring(2, 10);
      setGameState(prev => ({
        ...prev,
        roomId,
        playerId,
        players: [{ id: playerId, name: playerName, score: 0, answers: {}, isReady: false }]
      }));
      toast({
        title: "Sala criada (modo local)!",
        description: `Código da sala: ${roomId}`,
      });
    }
  };

  const joinRoom = (roomId: string, playerName: string) => {
    if (socketRef.current?.connected) {
      socketRef.current?.emit('joinRoom', { roomId, playerName });
    } else {
      // Modo local - simular entrada em sala
      toast({
        title: "Modo local ativo",
        description: "Para entrar em salas reais, inicie o servidor backend.",
        variant: "destructive"
      });
    }
  };

  const startRound = () => {
    socketRef.current?.emit('startRound');
  };

  const submitAnswers = (answers: Record<string, string>) => {
    socketRef.current?.emit('submitAnswers', { answers });
  };

  const stopGame = () => {
    socketRef.current?.emit('stopPressed');
  };

  const voteWord = (category: string, playerId: string, vote: 'accept' | 'reject') => {
    socketRef.current?.emit('voteWord', { category, playerId, vote });
  };

  const sendChatMessage = (message: string) => {
    if (socketRef.current?.connected) {
      socketRef.current?.emit('chatMessage', { message });
    } else {
      // Modo local - adicionar mensagem localmente
      const playerId = gameState.playerId || 'local';
      const playerName = gameState.players.find(p => p.id === playerId)?.name || 'Você';
      setGameState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, {
          id: Math.random().toString(36),
          playerId,
          playerName,
          message,
          timestamp: new Date()
        }]
      }));
    }
  };

  const updateCategories = (categories: Category[]) => {
    if (socketRef.current?.connected) {
      socketRef.current?.emit('updateCategories', { categories });
    } else {
      // Modo local - atualizar categorias localmente
      setGameState(prev => ({ ...prev, categories }));
      toast({
        title: "Categorias atualizadas (modo local)!",
        description: "As categorias foram modificadas.",
      });
    }
  };

  return {
    gameState,
    createRoom,
    joinRoom,
    startRound,
    submitAnswers,
    stopGame,
    voteWord,
    sendChatMessage,
    updateCategories
  };
};