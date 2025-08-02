import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react';

interface VotingModalProps {
  isOpen: boolean;
  votingData: any;
  onVote: (category: string, playerId: string, vote: 'accept' | 'reject') => void;
  currentPlayerId: string;
  currentLetter: string;
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

export const VotingModal = ({ isOpen, votingData, onVote, currentPlayerId, currentLetter }: VotingModalProps) => {
  const getTotalVotesNeeded = () => {
    let total = 0;
    CATEGORIES.forEach(category => {
      const categoryData = votingData[category.id];
      if (categoryData) {
        Object.keys(categoryData).forEach(playerId => {
          if (playerId !== currentPlayerId) {
            total++;
          }
        });
      }
    });
    return total;
  };

  const getCompletedVotes = () => {
    let completed = 0;
    CATEGORIES.forEach(category => {
      const categoryData = votingData[category.id];
      if (categoryData) {
        Object.keys(categoryData).forEach(playerId => {
          if (playerId !== currentPlayerId) {
            const votes = categoryData[playerId].votes || {};
            if (votes[currentPlayerId]) {
              completed++;
            }
          }
        });
      }
    });
    return completed;
  };

  const hasVoted = (category: string, playerId: string) => {
    const categoryData = votingData[category];
    if (!categoryData || !categoryData[playerId]) return false;
    const votes = categoryData[playerId].votes || {};
    return !!votes[currentPlayerId];
  };

  const getVoteResult = (category: string, playerId: string) => {
    const categoryData = votingData[category];
    if (!categoryData || !categoryData[playerId]) return null;
    return categoryData[playerId].result;
  };

  const completedVotes = getCompletedVotes();
  const totalVotes = getTotalVotesNeeded();
  const progress = totalVotes > 0 ? (completedVotes / totalVotes) * 100 : 0;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center space-x-2">
            <Users className="w-8 h-8 text-game-primary" />
            <span>Votação das Palavras - Letra "{currentLetter}"</span>
          </DialogTitle>
          <div className="text-center mt-2">
            <p className="text-muted-foreground mb-2">
              Vote se aceita ou rejeita as palavras dos outros jogadores
            </p>
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {completedVotes} de {totalVotes} votos realizados
              </span>
            </div>
            <Progress value={progress} className="mt-2" />
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {CATEGORIES.map((category) => {
            const categoryData = votingData[category.id] || {};
            const playersToVote = Object.keys(categoryData).filter(pid => pid !== currentPlayerId);
            
            if (playersToVote.length === 0) return null;

            return (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span className="text-xl">{category.icon}</span>
                    <span>{category.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {playersToVote.map((playerId) => {
                    const playerData = categoryData[playerId];
                    const voted = hasVoted(category.id, playerId);
                    const result = getVoteResult(category.id, playerId);
                    
                    return (
                      <div
                        key={playerId}
                        className={`p-4 border rounded-lg ${
                          voted ? 'bg-muted' : 'bg-background'
                        } ${result === 'accepted' ? 'border-green-300' : 
                            result === 'rejected' ? 'border-red-300' : 'border-border'}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold">{playerData.playerName}:</span>
                            <span className="text-lg font-medium">{playerData.answer}</span>
                          </div>
                          
                          {result && (
                            <Badge 
                              variant={result === 'accepted' ? 'default' : 'destructive'}
                              className="flex items-center space-x-1"
                            >
                              {result === 'accepted' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              <span>{result === 'accepted' ? 'Aceita' : 'Rejeitada'}</span>
                            </Badge>
                          )}
                        </div>
                        
                        {!voted && !result && (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => onVote(category.id, playerId, 'accept')}
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 hover:bg-green-50 hover:border-green-300"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>Aceitar</span>
                            </Button>
                            <Button
                              onClick={() => onVote(category.id, playerId, 'reject')}
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1 hover:bg-red-50 hover:border-red-300"
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span>Rejeitar</span>
                            </Button>
                          </div>
                        )}
                        
                        {voted && !result && (
                          <div className="text-sm text-muted-foreground">
                            ✅ Você já votou. Aguardando outros jogadores...
                          </div>
                        )}

                        {/* Mostrar votos atuais */}
                        {playerData.votes && Object.keys(playerData.votes).length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-xs text-muted-foreground mb-1">Votos recebidos:</div>
                            <div className="flex space-x-2">
                              {Object.entries(playerData.votes).map(([voterId, vote]) => (
                                <Badge 
                                  key={voterId}
                                  variant={vote === 'accept' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {vote === 'accept' ? '✓' : '✗'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
          
          {totalVotes === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma votação necessária</h3>
                <p className="text-muted-foreground">
                  Não há palavras de outros jogadores para votar nesta rodada.
                </p>
              </CardContent>
            </Card>
          )}
          
          {completedVotes === totalVotes && totalVotes > 0 && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="font-semibold text-green-800">
                Todas as votações concluídas!
              </p>
              <p className="text-sm text-green-700">
                Aguardando cálculo da pontuação...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};