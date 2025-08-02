import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Trophy, Users } from 'lucide-react';

interface GameBoardProps {
  currentLetter: string;
  onStopGame: () => void;
  isGameActive: boolean;
  timeLimit: number;
  onAnswerChange?: (category: string, value: string) => void;
  onSubmitAnswers?: (answers: Record<string, string>) => void;
  currentAnswers?: Record<string, string>;
  gameState?: 'waiting' | 'playing' | 'voting' | 'results';
  categories?: Category[];
}

interface Category {
  id: string;
  label: string;
  icon: string;
}

export const GameBoard = ({ 
  currentLetter, 
  onStopGame, 
  isGameActive, 
  timeLimit, 
  onAnswerChange,
  onSubmitAnswers,
  currentAnswers = {},
  gameState = 'waiting',
  categories = []
}: GameBoardProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>(currentAnswers);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isComplete, setIsComplete] = useState(false);

  // Sync with external answers
  useEffect(() => {
    setAnswers(currentAnswers);
  }, [currentAnswers]);

  // Use external timer instead of internal one for real-time sync
  useEffect(() => {
    setTimeLeft(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    const allFieldsFilled = categories.every(cat => answers[cat.id]?.trim());
    setIsComplete(allFieldsFilled);
    
    // Auto-submit when complete if callback provided
    if (allFieldsFilled && onSubmitAnswers) {
      onSubmitAnswers(answers);
    }
  }, [answers, onSubmitAnswers, categories]);

  const handleAnswerChange = (categoryId: string, value: string) => {
    const newAnswers = {
      ...answers,
      [categoryId]: value
    };
    setAnswers(newAnswers);
    
    // Call external handler if provided
    if (onAnswerChange) {
      onAnswerChange(categoryId, value);
    }
  };

  const handleStop = () => {
    if (onSubmitAnswers) {
      onSubmitAnswers(answers);
    }
    onStopGame();
  };

  const timePercentage = (timeLeft / timeLimit) * 100;
  const isTimeRunningOut = timeLeft <= 10;

  // Show different states based on game state
  if (gameState === 'waiting') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Users className="w-16 h-16 mx-auto text-game-primary" />
            <h2 className="text-2xl font-bold text-foreground">Aguardando início da rodada...</h2>
            <p className="text-muted-foreground">O administrador da sala pode iniciar a próxima rodada!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameState === 'voting') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-game-secondary" />
            <h2 className="text-2xl font-bold text-foreground">Votação em andamento!</h2>
            <p className="text-muted-foreground">Vote nas palavras dos outros jogadores para determinar a pontuação.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameState === 'results') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Trophy className="w-16 h-16 mx-auto text-game-accent" />
            <h2 className="text-2xl font-bold text-foreground">Rodada finalizada!</h2>
            <p className="text-muted-foreground">Confira os resultados e prepare-se para a próxima rodada.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isGameActive) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Users className="w-16 h-16 mx-auto text-game-primary" />
            <h2 className="text-2xl font-bold text-foreground">Aguardando próxima rodada...</h2>
            <p className="text-muted-foreground">A rodada ainda não começou!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Timer and Controls */}
      <Card className="bg-gradient-game text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className={`w-8 h-8 ${isTimeRunningOut ? 'animate-pulse text-game-warning' : ''}`} />
              <div>
                <p className="text-sm opacity-90">Tempo restante</p>
                <p className={`text-2xl font-bold ${isTimeRunningOut ? 'animate-shake text-game-warning' : ''}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm opacity-90">Letra atual</p>
              <p className="text-4xl font-black">{currentLetter}</p>
            </div>
            
            <Button
              onClick={handleStop}
              variant="secondary"
              size="lg"
              className={`bg-white text-game-primary hover:bg-gray-100 font-bold ${
                isComplete ? 'animate-pulse-game shadow-lg' : ''
              }`}
              disabled={!isComplete}
            >
              <Trophy className="w-5 h-5 mr-2" />
              STOP!
            </Button>
          </div>
          
          <div className="mt-4">
            <Progress 
              value={timePercentage} 
              className={`h-2 ${isTimeRunningOut ? 'animate-pulse' : ''}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="transform transition-all duration-200 hover:scale-105 hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-center flex items-center justify-center space-x-2">
                <span className="text-lg">{category.icon}</span>
                <span>{category.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Input
                value={answers[category.id] || ''}
                onChange={(e) => handleAnswerChange(category.id, e.target.value)}
                placeholder={`${category.label} com "${currentLetter}"`}
                className="text-center font-medium"
                disabled={!isGameActive}
              />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Progress Indicator */}
      <Card className="bg-muted">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progresso:</span>
            <span className="text-sm font-medium">
              {Object.values(answers).filter(answer => answer?.trim()).length} / {categories.length}
            </span>
          </div>
          <Progress 
            value={(Object.values(answers).filter(answer => answer?.trim()).length / categories.length) * 100} 
            className="mt-2"
          />
        </CardContent>
      </Card>
    </div>
  );
};