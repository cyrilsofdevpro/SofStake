'use client';

import { useEffect, useState } from 'react';

interface VictoryCelebrationProps {
  isVisible: boolean;
  onComplete: () => void;
  gameType: 'dice' | 'wheel';
  payout: number;
}

export function VictoryCelebration({ isVisible, onComplete, gameType, payout }: VictoryCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Start animation sequence
      setTimeout(() => setShowConfetti(true), 100);
      setTimeout(() => setShowTrophy(true), 300);
      setTimeout(() => setShowText(true), 600);

      // Auto-hide after 4 seconds
      setTimeout(() => {
        setShowConfetti(false);
        setShowTrophy(false);
        setShowText(false);
        onComplete();
      }, 4000);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Trophy Animation */}
      {showTrophy && (
        <div className="absolute animate-pulse">
          <div className="text-8xl sm:text-9xl animate-bounce">🏆</div>
        </div>
      )}

      {/* Victory Text */}
      {showText && (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-bold text-yellow-400 animate-pulse">
              VICTORY!
            </h1>
            <p className="text-xl sm:text-2xl text-white font-semibold">
              You won the {gameType === 'dice' ? 'Dice Battle' : 'Wheel Game'}!
            </p>
          </div>

          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl px-6 py-4 shadow-lg">
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">
              +₦{payout.toLocaleString()}
            </p>
            <p className="text-sm sm:text-base text-slate-800 font-semibold">
              Added to your wallet!
            </p>
          </div>

          <div className="flex justify-center gap-4 text-4xl">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>🎉</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</span>
            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🏅</span>
            <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>💰</span>
          </div>
        </div>
      )}

      {/* Firework Effects */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}