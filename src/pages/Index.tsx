import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LetterWheel } from '@/components/LetterWheel';
import { GameBoard } from '@/components/GameBoard';
import { ScoreBoard } from '@/components/ScoreBoard';
import { ResultsModal } from '@/components/ResultsModal';
import { VotingModal } from '@/components/VotingModal';
import { GameChat } from '@/components/GameChat';
import { CategoryManager } from '@/components/CategoryManager';
import { Gamepad2, Users, Clock, Trophy, Plus, LogIn } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const { toast } = useToast();
  const { 
    gameState, 
    createRoom, 
    joinRoom, 
    startRound, 
    submitAnswers, 
    stopGame, 
    voteWord,
    sendChatMessage,
    updateCategories
  } = useSocket();

  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>>({});

  // Reset answers when new round starts
  useEffect(() => {
    if (gameState.gameState === 'playing') {
      setCurrentAnswers({});
    }
  }, [gameState.gameState, gameState.currentRound]);

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite seu nome para criar uma sala.",
        variant: "destructive"
      });
      return;
    }
    createRoom(playerName);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Digite seu nome e o código da sala.",
        variant: "destructive"
      });
      return;
    }
    joinRoom(roomId.toUpperCase(), playerName);
  };

  const handleLetterSelected = (letter: string) => {
    // The server now handles letter selection
    setIsSpinning(false);
  };

  const handleStartRound = () => {
    if (gameState.players.length < 2) {
      toast({
        title: "Jogadores insuficientes",
        description: "É necessário pelo menos 2 jogadores para iniciar.",
        variant: "destructive"
      });
      return;
    }
    setIsSpinning(true);
    startRound();
  };

  const handleStopGame = () => {
    stopGame(currentAnswers);
  };

  const handleAnswerChange = (category: string, value: string) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmitAnswers = (answers: Record<string, string>) => {
    setCurrentAnswers(answers);
    submitAnswers(answers);
  };

  const handleVote = (category: string, playerId: string, vote: 'accept' | 'reject') => {
    voteWord(category, playerId, vote);
  };

  const handleNewRound = () => {
    setShowResults(false);
  };

  // Show voting modal when game state is voting
  useEffect(() => {
    if (gameState.gameState === 'voting') {
      // Voting is handled by VotingModal, no need to show results yet
    } else if (gameState.gameState === 'results') {
      setShowResults(true);
    }
  }, [gameState.gameState]);

  // Not connected to server
  if (!gameState.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Conectando ao servidor...</h2>
            <p className="text-white/80">Por favor aguarde</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not in a room yet
  if (!gameState.roomId) {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
              <Gamepad2 className="w-8 h-8 text-game-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">STOP Online</CardTitle>
            <p className="text-muted-foreground">Jogo multiplayer em tempo real</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Seu nome:</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Digite seu nome"
                className="text-center"
                maxLength={20}
              />
            </div>
            
            {!showJoinRoom ? (
              <div className="space-y-3">
                <Button 
                  onClick={handleCreateRoom}
                  className="w-full bg-gradient-secondary hover:bg-gradient-accent text-white"
                  size="lg"
                  disabled={!playerName.trim()}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Nova Sala
                </Button>
                
                <Button 
                  onClick={() => setShowJoinRoom(true)}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Entrar em Sala
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Código da sala:</label>
                  <Input
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    className="text-center uppercase"
                    maxLength={6}
                  />
                </div>
                
                <Button 
                  onClick={handleJoinRoom}
                  className="w-full bg-gradient-secondary hover:bg-gradient-accent text-white"
                  size="lg"
                  disabled={!playerName.trim() || !roomId.trim()}
                >
                  Entrar na Sala
                </Button>
                
                <Button 
                  onClick={() => setShowJoinRoom(false)}
                  variant="outline"
                  className="w-full"
                >
                  Voltar
                </Button>
              </div>
            )}
            
            
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-game text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Gamepad2 className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">STOP Online</h1>
                <p className="text-sm opacity-90">
                  Sala: {gameState.roomId} | Rodada {gameState.currentRound}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <Users className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm">{gameState.players.length} jogadores</p>
              </div>
              <div className="text-center">
                <Clock className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm">{gameState.timeLeft}s restantes</p>
              </div>
              <div className="text-center">
                <Trophy className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm capitalize">{gameState.gameState}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Sidebar - Wheel and Score */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">🎲 Sorteio</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <LetterWheel
                  onLetterSelected={handleLetterSelected}
                  isSpinning={isSpinning}
                  setIsSpinning={setIsSpinning}
                  targetLetter={gameState.currentLetter}
                />
                
                {gameState.gameState === 'waiting' && (
                  <div className="space-y-2">
                    <Button
                      onClick={handleStartRound}
                      className="w-full bg-gradient-secondary hover:bg-gradient-accent text-white"
                      disabled={gameState.players.length < 2}
                    >
                      Iniciar Rodada
                    </Button>
                    <CategoryManager
                      categories={gameState.categories}
                      onUpdateCategories={updateCategories}
                      isHost={gameState.isHost}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <ScoreBoard 
              players={gameState.players} 
              currentRound={gameState.currentRound} 
            />
          </div>

          {/* Main Game Board */}
          <div className="lg:col-span-3">
            <GameBoard
              currentLetter={gameState.currentLetter}
              onStopGame={handleStopGame}
              isGameActive={gameState.gameState === 'playing'}
              timeLimit={60}
              onAnswerChange={handleAnswerChange}
              onSubmitAnswers={handleSubmitAnswers}
              currentAnswers={currentAnswers}
              gameState={gameState.gameState}
              categories={gameState.categories}
            />
          </div>

          {/* Right Sidebar - Chat */}
          <div className="lg:col-span-1">
            <GameChat
              playerId={gameState.playerId || 'local'}
              playerName={gameState.players.find(p => p.id === gameState.playerId)?.name || 'Você'}
              messages={gameState.chatMessages}
              onSendMessage={sendChatMessage}
            />
          </div>
        </div>
      </div>

      {/* Voting Modal */}
      <VotingModal
        isOpen={gameState.gameState === 'voting'}
        votingData={gameState.votingData}
        onVote={handleVote}
        currentPlayerId={gameState.playerId || ''}
        currentLetter={gameState.currentLetter}
      />

      {/* Results Modal */}
      <ResultsModal
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        players={gameState.players}
        currentLetter={gameState.currentLetter}
        onNewRound={handleNewRound}
      />
    </div>
  );
};

export default Index;
