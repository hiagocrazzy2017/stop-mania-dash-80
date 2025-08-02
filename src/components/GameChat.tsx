import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

interface GameChatProps {
  playerId: string;
  playerName: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const emojis = [
  '😀', '😂', '🤣', '😊', '😍', '🤔', '😮', '😎', '🤪', '😢',
  '😡', '🥳', '🤯', '🔥', '💯', '👍', '👎', '👏', '🙌', '💪',
  '🎉', '🎊', '❤️', '💚', '💙', '🧡', '💜', '🤍', '🖤', '💛'
];

export const GameChat = ({ playerId, playerName, messages, onSendMessage }: GameChatProps) => {
  const [message, setMessage] = useState('');
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setIsEmojiOpen(false);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <span>💬</span>
          <span>Chat do Jogo</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-3 p-4 pt-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <p>💬 Nenhuma mensagem ainda</p>
                <p>Seja o primeiro a falar!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.playerId === playerId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.playerId === playerId
                        ? 'bg-gradient-secondary text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.playerId !== playerId && (
                      <div className="text-xs font-medium mb-1 opacity-80">
                        {msg.playerName}
                      </div>
                    )}
                    <div className="text-sm break-words">{msg.message}</div>
                    <div className={`text-xs mt-1 ${
                      msg.playerId === playerId ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 flex items-center space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              maxLength={200}
            />
            
            <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="grid grid-cols-6 gap-1">
                  {emojis.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="text-lg p-1 h-8 w-8"
                      onClick={() => addEmoji(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="sm"
            className="bg-gradient-secondary hover:bg-gradient-accent text-white px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};