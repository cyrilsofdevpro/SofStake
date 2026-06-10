'use client';

import { useState, useEffect } from 'react';
import { getStoredUser, addTransaction } from '@/lib/user';

interface CrashGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CrashGameModal({ isOpen, onClose }: CrashGameModalProps) {
  const [user, setUser] = useState(getStoredUser());
  const [roundId, setRoundId] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'running' | 'crashed'>('waiting');
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [betStatus, setBetStatus] = useState<'idle' | 'placed' | 'won' | 'lost'>('idle');
  const [winnings, setWinnings] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const walletBalance = user?.walletBalance || 0;

  // Start a new round
  const startRound = async () => {
    try {
      setError('');
      setIsProcessing(true);

      const response = await fetch('/api/crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-round' })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRoundId(data.data.roundId);
      setCrashPoint(data.data.crashPoint);
      setGameStatus('running');
      setMultiplier(1.0);
      setBetStatus('idle');
      setWinnings(0);

      // Simulate multiplier increase
      let currentMultiplier = 1.0;
      const interval = setInterval(() => {
        currentMultiplier += Math.random() * 0.15;
        setMultiplier(Math.round(currentMultiplier * 100) / 100);

        if (currentMultiplier >= (crashPoint || 5)) {
          clearInterval(interval);
          setGameStatus('crashed');
        }
      }, 100);

      return () => clearInterval(interval);
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  // Place a bet
  const placeBet = async () => {
    if (betAmount > walletBalance) {
      setError('Insufficient balance');
      return;
    }

    try {
      setError('');
      setIsProcessing(true);

      const response = await fetch('/api/crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'place-bet',
          userId: user?.id,
          roundId,
          betAmount,
          autoCashout
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setBetStatus('placed');
      setIsProcessing(false);
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  // Manual cashout
  const cashOut = async () => {
    try {
      setError('');
      setIsProcessing(true);

      const response = await fetch('/api/crash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cashout',
          userId: user?.id,
          roundId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setWinnings(data.data.winAmount);
      setBetStatus('won');

      // Update user in local storage
      const updatedUser = addTransaction('win', data.data.totalPayout, `Crash game win (${multiplier}x)`, 'completed');
      if (updatedUser) {
        setUser(updatedUser);
      }

      setIsProcessing(false);
    } catch (err: any) {
      setError(err.message);
      setBetStatus('lost');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/95 p-8">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-white"
        >
          ✕
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Crash Game</h2>
          <p className="mt-2 text-sm text-slate-400">Place your bet and cash out before the crash</p>
        </div>

        {/* Game Display */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-8 text-center">
          <div className="text-6xl font-bold text-white">
            {multiplier.toFixed(2)}x
          </div>
          <div className="mt-4 text-sm text-slate-300">
            {gameStatus === 'waiting' && 'Game not started'}
            {gameStatus === 'running' && 'Game running...'}
            {gameStatus === 'crashed' && `💥 CRASHED at ${crashPoint?.toFixed(2)}x`}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-6 rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {betStatus === 'won' && (
          <div className="mt-6 rounded-2xl bg-green-500/10 p-4 text-center">
            <p className="text-sm font-semibold text-green-300">🎉 YOU WON!</p>
            <p className="mt-2 text-2xl font-bold text-green-300">₦{winnings.toLocaleString()}</p>
          </div>
        )}

        {betStatus === 'lost' && gameStatus === 'crashed' && (
          <div className="mt-6 rounded-2xl bg-red-500/10 p-4 text-center">
            <p className="text-sm font-semibold text-red-300">Game crashed before cashout</p>
          </div>
        )}

        {/* Wallet Balance */}
        <div className="mt-6 rounded-2xl bg-white/5 p-4">
          <p className="text-xs text-slate-400">WALLET BALANCE</p>
          <p className="mt-1 text-2xl font-semibold text-white">₦{walletBalance.toLocaleString()}</p>
        </div>

        {/* Controls */}
        {gameStatus === 'waiting' && (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Bet Amount</span>
              <input
                type="number"
                min={10}
                step={10}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                max={walletBalance}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white outline-none focus:border-accent"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Auto Cashout At</span>
              <input
                type="number"
                min={1.01}
                step={0.1}
                value={autoCashout}
                onChange={(e) => setAutoCashout(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-white outline-none focus:border-accent"
              />
            </label>

            <button
              onClick={() => {
                startRound();
                placeBet();
              }}
              disabled={isProcessing || betAmount > walletBalance}
              className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-slate-950 transition hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? 'Starting...' : `Start Game (₦${betAmount.toLocaleString()})`}
            </button>
          </div>
        )}

        {gameStatus === 'running' && betStatus === 'placed' && (
          <button
            onClick={cashOut}
            disabled={isProcessing}
            className="mt-6 w-full rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? 'Cashing out...' : 'CASH OUT NOW'}
          </button>
        )}

        {(gameStatus === 'crashed' || betStatus === 'won' || betStatus === 'lost') && (
          <button
            onClick={() => {
              setGameStatus('waiting');
              setBetStatus('idle');
              setMultiplier(1.0);
              setRoundId(null);
              setError('');
            }}
            className="mt-6 w-full rounded-xl bg-accent px-4 py-3 font-semibold text-slate-950 transition hover:bg-accent2"
          >
            Play Again
          </button>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-white/10 px-4 py-3 font-semibold text-slate-300 transition hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
