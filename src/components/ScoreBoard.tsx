import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Star, Users } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  score: number;
  answers: Record<string, string>;
}

interface ScoreBoardProps {
  players: Player[];
  currentRound: number;
}

export const ScoreBoard = ({ players, currentRound }: ScoreBoardProps) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <Star className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 0:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-500";
      case 2:
        return "bg-gradient-to-r from-amber-400 to-amber-600";
      default:
        return "bg-gradient-to-r from-blue-400 to-blue-600";
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="bg-gradient-game text-white rounded-t-lg">
        <CardTitle className="text-center flex items-center justify-center space-x-2">
          <Trophy className="w-6 h-6" />
          <span>Ranking - Rodada {currentRound}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {sortedPlayers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum jogador ainda</p>
          </div>
        ) : (
          sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-gray-50'
              } transform transition-all duration-200 hover:scale-102`}
            >
              <div className={`p-2 rounded-full text-white ${getPositionColor(index)}`}>
                {getPositionIcon(index)}
              </div>
              
              <div className="flex-1">
                <p className="font-semibold text-foreground">{player.name}</p>
                <p className="text-sm text-muted-foreground">
                  {Object.values(player.answers).filter(answer => answer?.trim()).length} respostas
                </p>
              </div>
              
              <div className="text-right">
                <Badge 
                  variant={index === 0 ? "default" : "secondary"}
                  className={index === 0 ? "bg-game-primary" : ""}
                >
                  {player.score} pts
                </Badge>
              </div>
            </div>
          ))
        )}
        
        {sortedPlayers.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-center text-sm text-muted-foreground">
              <p>Total de jogadores: {sortedPlayers.length}</p>
              <p>Pontuação máxima: {Math.max(...sortedPlayers.map(p => p.score), 0)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};