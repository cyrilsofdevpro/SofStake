'use client';

import { useState, useEffect } from 'react';

interface DiceGameModalProps {
  isOpen: boolean;
  opponent: string;
  onClose: () => void;
  onResult: (playerValue: number, opponentValue: number) => void;
}

export function DiceGameModal({ isOpen, opponent, onClose, onResult }: DiceGameModalProps) {
  const [playerDice, setPlayerDice] = useState(1);
  const [opponentDice, setOpponentDice] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [playerResult, setPlayerResult] = useState(0);
  const [opponentResult, setOpponentResult] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setIsRolling(false);
      setShowResult(false);
      setPlayerDice(1);
      setOpponentDice(1);
    }
  }, [isOpen]);

  const handleRoll = () => {
    if (isRolling) return;

    setIsRolling(true);
    setShowResult(false);

    // Animate rolling
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setPlayerDice(Math.floor(Math.random() * 6) + 1);
      setOpponentDice(Math.floor(Math.random() * 6) + 1);
      rollCount++;

      if (rollCount > 20) {
        clearInterval(rollInterval);

        // Set final results
        const finalPlayerResult = Math.floor(Math.random() * 6) + 1;
        const finalOpponentResult = Math.floor(Math.random() * 6) + 1;

        setPlayerDice(finalPlayerResult);
        setOpponentDice(finalOpponentResult);
        setPlayerResult(finalPlayerResult);
        setOpponentResult(finalOpponentResult);

        setIsRolling(false);
        setShowResult(true);
      }
    }, 100);
  };

  const handleConfirm = () => {
    onResult(playerResult, opponentResult);
    handleClose();
  };

  const handleClose = () => {
    setIsRolling(false);
    setShowResult(false);
    setPlayerDice(1);
    setOpponentDice(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-accent">Dice Battle</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Real-time Dice Toss</h2>
        </div>

        {/* Dice Container */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
          {/* Player Dice */}
          <div className="flex flex-col items-center">
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-slate-300">You</p>
            <div
              className={`relative h-32 w-32 sm:h-40 sm:w-40 rounded-2xl border-4 flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5 text-5xl sm:text-6xl font-bold text-accent transition-all ${
                isRolling ? 'animate-spin border-accent' : 'border-accent'
              }`}
              style={{
                animationDuration: isRolling ? '100ms' : undefined,
              }}
            >
              {playerDice}
            </div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">vs</p>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300 text-center whitespace-nowrap">
              {opponent}
            </div>
          </div>

          {/* Opponent Dice */}
          <div className="flex flex-col items-center">
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-slate-300">{opponent}</p>
            <div
              className={`relative h-32 w-32 sm:h-40 sm:w-40 rounded-2xl border-4 border-yellow-500 flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 text-5xl sm:text-6xl font-bold text-yellow-500 transition-all ${
                isRolling ? 'animate-spin' : ''
              }`}
              style={{
                animationDuration: isRolling ? '100ms' : undefined,
              }}
            >
              {opponentDice}
            </div>
          </div>
        </div>

        {/* Result */}
        {showResult && (
          <div className="mb-6 sm:mb-8 rounded-2xl border border-white/10 bg-black/30 p-4 sm:p-6 text-center">
            <p className="mb-3 text-xs sm:text-sm uppercase tracking-[0.25em] text-slate-400">Result</p>
            {playerResult === opponentResult ? (
              <p className="text-xl sm:text-2xl font-bold text-yellow-500">It's a Tie! 🤝</p>
            ) : playerResult > opponentResult ? (
              <p className="text-xl sm:text-2xl font-bold text-green-500">You Win! 🎉</p>
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-red-500">You Lose 😢</p>
            )}
            <p className="mt-2 text-xs sm:text-sm text-slate-300">
              Your: <span className="font-bold text-accent">{playerResult}</span> vs {opponent}:{' '}
              <span className="font-bold text-yellow-500">{opponentResult}</span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={handleRoll}
            disabled={isRolling}
            className="flex-1 rounded-full bg-accent px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRolling ? 'Rolling...' : showResult ? 'Roll Again' : 'Roll Dice'}
          </button>
          {showResult && (
            <button
              onClick={handleConfirm}
              className="flex-1 rounded-full border border-accent bg-accent/10 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-accent transition hover:bg-accent/20"
            >
              Confirm Result
            </button>
          )}
          <button
            onClick={handleClose}
            className="flex-1 sm:flex-none rounded-full border border-white/10 bg-white/5 px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:border-accent"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotateX(0deg) rotateY(0deg);
          }
          to {
            transform: rotateX(360deg) rotateY(360deg);
          }
        }

        .animate-spin {
          animation: spin 0.1s linear;
        }
      `}</style>
    </div>
  );
}
