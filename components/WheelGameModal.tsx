'use client';

import { useState, useEffect } from 'react';

interface WheelGameModalProps {
  isOpen: boolean;
  opponent: string;
  onClose: () => void;
  onResult: (playerValue: number, opponentValue: number) => void;
}

export function WheelGameModal({ isOpen, opponent, onClose, onResult }: WheelGameModalProps) {
  const [playerSpin, setPlayerSpin] = useState(0);
  const [opponentSpin, setOpponentSpin] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [playerResult, setPlayerResult] = useState(0);
  const [opponentResult, setOpponentResult] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setIsSpinning(false);
      setShowResult(false);
      setPlayerSpin(0);
      setOpponentSpin(0);
    }
  }, [isOpen]);

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);

    // Generate final results first
    const finalPlayerResult = Math.floor(Math.random() * 91) + 10; // 10-100
    const finalOpponentResult = Math.floor(Math.random() * 91) + 10; // 10-100

    // Calculate rotations to land on results
    const playerRotations = Math.random() * 3600 + 3600; // Multiple full rotations
    const opponentRotations = Math.random() * 3600 + 3600;

    // Animate spinning
    setPlayerSpin(playerRotations);
    setOpponentSpin(opponentRotations);

    setTimeout(() => {
      setPlayerResult(finalPlayerResult);
      setOpponentResult(finalOpponentResult);
      setIsSpinning(false);
      setShowResult(true);
    }, 3000);
  };

  const handleConfirm = () => {
    onResult(playerResult, opponentResult);
    handleClose();
  };

  const handleClose = () => {
    setIsSpinning(false);
    setShowResult(false);
    setPlayerSpin(0);
    setOpponentSpin(0);
    onClose();
  };

  const wheelSegments = Array.from({ length: 10 }, (_, i) => ({
    value: 10 + i * 10,
    angle: (i * 36),
    color: [
      'from-red-500 to-red-600',
      'from-orange-500 to-orange-600',
      'from-yellow-500 to-yellow-600',
      'from-green-500 to-green-600',
      'from-blue-500 to-blue-600',
      'from-indigo-500 to-indigo-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-rose-500 to-rose-600',
      'from-cyan-500 to-cyan-600',
    ][i],
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-accent">Wheel Game</p>
          <h2 className="mt-2 text-3xl font-bold text-white">Real-time Spin</h2>
        </div>

        {/* Wheels Container - Stack on mobile, side-by-side on desktop */}
        <div className="mb-8 space-y-8 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:items-center">
          {/* Player Wheel */}
          <div className="flex flex-col items-center">
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-slate-300">You</p>
            <div className="relative h-40 w-40 sm:h-48 sm:w-48">
              {/* Wheel */}
              <div
                className={`absolute inset-0 rounded-full border-4 sm:border-8 border-white/20 transition-transform ${
                  isSpinning ? '' : 'duration-300'
                }`}
                style={{
                  background: 'conic-gradient(from 0deg, rgb(239, 68, 68), rgb(249, 115, 22), rgb(234, 179, 8), rgb(34, 197, 94), rgb(59, 130, 246), rgb(79, 70, 229), rgb(147, 51, 234), rgb(236, 72, 153), rgb(244, 63, 94), rgb(34, 211, 238))',
                  transform: `rotate(${playerSpin}deg)`,
                }}
              />
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 sm:h-6 sm:w-6 rounded-full bg-slate-900 border-2 border-white" />
              </div>
              {/* Pointer */}
              <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-3 sm:border-l-4 border-r-3 sm:border-r-4 border-t-4 sm:border-t-6 border-l-transparent border-r-transparent border-t-accent" />
            </div>
            {showResult && (
              <p className="mt-4 text-xl sm:text-2xl font-bold text-accent">{playerResult}</p>
            )}
          </div>

          {/* vs divider */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">vs</p>
            <div className="mt-2 rounded-full bg-white/10 px-3 py-2 text-xs sm:text-sm text-slate-300 text-center">
              {opponent}
            </div>
          </div>

          {/* Opponent Wheel */}
          <div className="flex flex-col items-center">
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-slate-300">{opponent}</p>
            <div className="relative h-40 w-40 sm:h-48 sm:w-48">
              {/* Wheel */}
              <div
                className={`absolute inset-0 rounded-full border-4 sm:border-8 border-white/20 transition-transform ${
                  isSpinning ? '' : 'duration-300'
                }`}
                style={{
                  background: 'conic-gradient(from 0deg, rgb(239, 68, 68), rgb(249, 115, 22), rgb(234, 179, 8), rgb(34, 197, 94), rgb(59, 130, 246), rgb(79, 70, 229), rgb(147, 51, 234), rgb(236, 72, 153), rgb(244, 63, 94), rgb(34, 211, 238))',
                  transform: `rotate(${opponentSpin}deg)`,
                }}
              />
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 sm:h-6 sm:w-6 rounded-full bg-slate-900 border-2 border-white" />
              </div>
              {/* Pointer */}
              <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-3 sm:border-l-4 border-r-3 sm:border-r-4 border-t-4 sm:border-t-6 border-l-transparent border-r-transparent border-t-yellow-500" />
            </div>
            {showResult && (
              <p className="mt-4 text-xl sm:text-2xl font-bold text-yellow-500">{opponentResult}</p>
            )}
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
            onClick={handleSpin}
            disabled={isSpinning}
            className="flex-1 rounded-full bg-accent px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSpinning ? 'Spinning...' : showResult ? 'Spin Again' : 'Spin Wheel'}
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
    </div>
  );
}
