import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, RotateCcw } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  answers: Record<string, string>;
  score: number;
}

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  currentLetter: string;
  onNewRound: () => void;
}

const CATEGORIES = [
  { id: 'nome', label: 'Nome', icon: '👤' },
  { id: 'animal', label: 'Animal', icon: '🐾' },
  { id: 'cor', label: 'Cor', icon: '🎨' },
  { id: 'objeto', label: 'Objeto', icon: '📦' },
  { id: 'filme', label: 'Filme', icon: '🎬' },
  { id: 'cep', label: 'CEP', icon: '📍' },
  { id: 'comida', label: 'Comida', icon: '🍕' },
  { id: 'profissao', label: 'Profissão', icon: '💼' }
];

export const ResultsModal = ({ isOpen, onClose, players, currentLetter, onNewRound }: ResultsModalProps) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  const calculatePoints = (answer: string, category: string) => {
    if (!answer?.trim()) return 0;
    
    // Simula pontuação: verifica se outros jogadores têm a mesma resposta
    const sameAnswers = players.filter(p => 
      p.answers[category]?.toLowerCase().trim() === answer.toLowerCase().trim()
    ).length;
    
    if (sameAnswers === 1) return 10; // Resposta única
    if (sameAnswers > 1) return 5;   // Resposta repetida
    return 0; // Resposta inválida
  };

  const getAnswerColor = (points: number) => {
    if (points === 10) return 'bg-green-100 text-green-800 border-green-200';
    if (points === 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center space-x-2">
            <Trophy className="w-8 h-8 text-game-primary" />
            <span>Resultados da Rodada - Letra "{currentLetter}"</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Ranking */}
          <Card className="bg-gradient-game text-white">
            <CardHeader>
              <CardTitle className="text-center">🏆 Ranking Final</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sortedPlayers.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                      </span>
                      <span className="font-semibold">{player.name}</span>
                    </div>
                    <Badge variant="secondary" className="bg-white text-game-primary font-bold">
                      {player.score} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">📝 Respostas Detalhadas</h3>
            
            {CATEGORIES.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {players.map((player) => {
                      const answer = player.answers[category.id] || '';
                      const points = calculatePoints(answer, category.id);
                      
                      return (
                        <div
                          key={player.id}
                          className={`p-3 rounded-lg border ${getAnswerColor(points)}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{player.name}:</span>
                            <Badge variant="outline" className="ml-2">
                              {points} pts
                            </Badge>
                          </div>
                          <p className="text-sm mt-1">
                            {answer || <em className="text-gray-500">Não respondeu</em>}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-4">
            <Button onClick={onClose} variant="outline" size="lg">
              Ver Ranking
            </Button>
            <Button 
              onClick={onNewRound} 
              size="lg"
              className="bg-gradient-secondary hover:bg-gradient-accent text-white"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Nova Rodada
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};