import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface LetterWheelProps {
  onLetterSelected: (letter: string) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X'];

export const LetterWheel = ({ onLetterSelected, isSpinning, setIsSpinning }: LetterWheelProps) => {
  const [currentLetter, setCurrentLetter] = useState('A');
  const [spinDuration, setSpinDuration] = useState(0);

  const spinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    const duration = Math.random() * 2000 + 2000; // 2-4 seconds
    setSpinDuration(duration);
    
    let interval: NodeJS.Timeout;
    let elapsed = 0;
    const intervalTime = 50;
    
    interval = setInterval(() => {
      setCurrentLetter(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
      elapsed += intervalTime;
      
      if (elapsed >= duration) {
        clearInterval(interval);
        const finalLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        setCurrentLetter(finalLetter);
        setIsSpinning(false);
        onLetterSelected(finalLetter);
      }
    }, intervalTime);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        <div 
          className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-game border-4 border-white shadow-2xl flex items-center justify-center transform transition-transform duration-300 ${
            isSpinning ? 'animate-spin-slow scale-110' : 'hover:scale-105'
          }`}
        >
          <span 
            className={`text-4xl md:text-6xl font-black text-white ${
              isSpinning ? 'animate-pulse-game' : ''
            }`}
          >
            {currentLetter}
          </span>
        </div>
        
        {isSpinning && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-game-warning rounded-full animate-pulse">
            <div className="w-full h-full bg-game-warning rounded-full animate-ping"></div>
          </div>
        )}
      </div>
      
      <Button
        onClick={spinWheel}
        disabled={isSpinning}
        size="lg"
        className="bg-gradient-secondary hover:bg-gradient-accent text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSpinning ? 'Girando...' : 'Girar Roleta'}
      </Button>
    </div>
  );
};