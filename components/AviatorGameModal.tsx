'use client';

import { useState, useEffect, useRef } from 'react';

interface AviatorGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (crashPoint: number, cashOutPoint: number | null) => void;
  stake: number;
}

export function AviatorGameModal({ isOpen, onClose, onResult, stake }: AviatorGameModalProps) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [isFlying, setIsFlying] = useState(false);
  const [hasPlane, setHasPlane] = useState(true);
  const [cashOutPoint, setCashOutPoint] = useState<number | null>(null);
  const [canCashOut, setCanCashOut] = useState(true);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(0);
  const multiplierRef = useRef(1.0);

  useEffect(() => {
    if (!isOpen) {
      resetGame();
    }
  }, [isOpen]);

  const resetGame = () => {
    setMultiplier(1.0);
    setIsFlying(false);
    setHasPlane(true);
    setCashOutPoint(null);
    setCanCashOut(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const startRound = () => {
    if (isFlying) return;

    resetGame();
    setIsFlying(true);
    setCanCashOut(true);
    setCashOutPoint(null);

    // Generate random crash point between 1.01 and 10.00
    crashPointRef.current = Math.floor(Math.random() * 980) / 100 + 1.01;
    startTimeRef.current = Date.now();
    multiplierRef.current = 1.0;

    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      // Exponential growth curve
      const newMultiplier = Math.pow(1.1, elapsed * 2);

      if (newMultiplier >= crashPointRef.current) {
        // Plane crashed
        setMultiplier(crashPointRef.current);
        setIsFlying(false);
        setHasPlane(false);
        setCanCashOut(false);

        if (!cashOutPoint) {
          // Player didn't cash out, they lost
          onResult(crashPointRef.current, null);
        }
        return;
      }

      setMultiplier(Math.min(newMultiplier, 10.0));
      multiplierRef.current = newMultiplier;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const handleCashOut = () => {
    if (!isFlying || !canCashOut) return;

    const cashOut = Math.round(multiplier * 100) / 100;
    setCashOutPoint(cashOut);
    setIsFlying(false);
    setHasPlane(false);
    setCanCashOut(false);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Player cashed out, they won
    onResult(crashPointRef.current, cashOut);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-black p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Aviator</h2>
          <p className="text-sm text-slate-400">Cash out before the plane crashes!</p>
        </div>

        {/* Game Canvas Area */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-slate-950/50 p-8 min-h-[300px] relative overflow-hidden">
          {/* Plane Animation */}
          <div className="relative h-48 mb-4">
            {hasPlane && (
              <div
                className={`absolute left-0 top-4 text-4xl transition-all ${
                  isFlying ? 'opacity-100' : 'opacity-50'
                }`}
                style={{
                  transform: `translateX(${Math.min(multiplier * 30, 320)}px) translateY(${
                    Math.sin(multiplier) * 40
                  }px)`,
                  transition: 'none'
                }}
              >
                ✈️
              </div>
            )}
            {!hasPlane && (
              <div className="absolute left-0 top-4 text-4xl opacity-30">💥</div>
            )}
          </div>

          {/* Multiplier Display */}
          <div className="text-center mb-4">
            <div className={`text-5xl font-bold transition-colors ${
              isFlying ? 'text-yellow-400' : hasPlane ? 'text-red-500' : 'text-green-400'
            }`}>
              {multiplier.toFixed(2)}x
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {isFlying
                ? 'Plane is flying...'
                : hasPlane
                ? `Crashed at ${crashPointRef.current.toFixed(2)}x`
                : cashOutPoint
                ? `You cashed out at ${cashOutPoint.toFixed(2)}x`
                : 'You lost!'}
            </p>
          </div>

          {/* Crash Point Indicator */}
          <div className="text-center text-xs text-slate-500">
            {crashPointRef.current > 0 && `Crash point: ${crashPointRef.current.toFixed(2)}x`}
          </div>
        </div>

        {/* Bet Info */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl bg-slate-900/30 p-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Your Stake</p>
            <p className="mt-1 text-lg font-semibold text-white">₦{stake.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Potential Payout</p>
            <p className="mt-1 text-lg font-semibold text-green-400">
              ₦{Math.round(stake * multiplier).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isFlying && !hasPlane ? (
            <>
              <button
                onClick={() => {
                  resetGame();
                  onClose();
                }}
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 min-h-[44px]"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startRound}
                disabled={isFlying}
                className="flex-1 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              >
                {isFlying ? 'Round in progress...' : 'Start Round'}
              </button>
              <button
                onClick={handleCashOut}
                disabled={!isFlying || !canCashOut}
                className="flex-1 rounded-full border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-400 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              >
                Cash Out Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
