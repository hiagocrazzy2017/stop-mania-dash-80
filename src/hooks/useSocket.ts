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
    // Conectar apenas ao servidor de produção
    const serverUrl = window.location.origin;
    
    console.log('Conectando ao servidor:', serverUrl);
    
    // Conectar ao servidor
    socketRef.current = io(serverUrl, {
      timeout: 20000,
      forceNew: true
    });
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Conectado ao servidor backend!');
      setGameState(prev => ({ ...prev, isConnected: true }));
      toast({
        title: "Conectado ao servidor",
        description: "Você está pronto para jogar online!",
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor backend');
      setGameState(prev => ({ ...prev, isConnected: false }));
      toast({
        title: "Desconectado",
        description: "Tentando reconectar...",
        variant: "destructive"
      });
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error.message);
      toast({
        title: "Erro de conexão",
        description: `Não foi possível conectar ao servidor: ${error.message}`,
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
    socketRef.current?.emit('createRoom', { playerName });
  };

  const joinRoom = (roomId: string, playerName: string) => {
    socketRef.current?.emit('joinRoom', { roomId, playerName });
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
    socketRef.current?.emit('chatMessage', { message });
  };

  const updateCategories = (categories: Category[]) => {
    socketRef.current?.emit('updateCategories', { categories });
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