'use client';

import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';
import { getStoredUser, addTransaction, StoredUser } from '@/lib/user';

interface CoinFlipProps {
  onGameComplete?: (result: { won: boolean; payout: number }) => void;
}

export default function CoinFlipGame({ onGameComplete }: CoinFlipProps) {
  const gameRef = useRef<Game | null>(null);
  const sceneRef = useRef<any>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<{ won: boolean; result: string; payout: number } | null>(null);
  const [error, setError] = useState('');
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const walletAvailable = user?.walletBalance || 0;
  const canBet = choice && betAmount >= 10 && betAmount <= walletAvailable && !isPlaying;

  // Load user and game history
  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setWalletBalance(storedUser?.walletBalance || 0);

    if (storedUser?.id) {
      loadGameHistory(storedUser.id);
      loadGameStats(storedUser.id);
    }
  }, []);

  const loadGameHistory = async (userId: string) => {
    try {
      const res = await fetch(`/api/games/coinflip?userId=${userId}&action=history`);
      const data = await res.json();
      if (data.status) {
        setGameHistory(data.data.slice(0, 10));
      }
    } catch (err) {
      console.error('Failed to load game history:', err);
    }
  };

  const loadGameStats = async (userId: string) => {
    try {
      const res = await fetch(`/api/games/coinflip?userId=${userId}&action=stats`);
      const data = await res.json();
      if (data.status) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load game stats:', err);
    }
  };

  // Initialize Phaser game
  useEffect(() => {
    if (gameRef.current || !choice) return;

    let isMounted = true;

    async function initPhaser() {
      const PhaserModule = await import('phaser');
      const Phaser = PhaserModule as typeof import('phaser');
      if (!isMounted) return;

      class CoinFlipScene extends Phaser.Scene {
        private coin?: Phaser.GameObjects.Arc;

        constructor() {
          super({ key: 'CoinFlipScene' });
        }

        preload() {
          // No external assets required for this simple coin demo.
        }

        create() {
          const coin = this.add.circle(150, 150, 75, 0xffd700);
          coin.setStrokeStyle(4, 0xffaa00);
          coin.setDepth(1);

          this.add.text(150, 150, choice === 'heads' ? 'H' : 'T', {
            font: 'bold 48px Arial',
            color: '#000000',
            align: 'center'
          }).setOrigin(0.5);

          this.coin = coin;
        }

        update() {
          if (this.coin) {
            this.coin.rotation += 0.05;
          }
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: 'coin-flip-canvas',
        width: 300,
        height: 300,
        backgroundColor: '#1e293b',
        scene: CoinFlipScene
      };

      gameRef.current = new Phaser.Game(config);
    }

    initPhaser();

    return () => {
      isMounted = false;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [choice]);

  const handlePlayGame = async () => {
    if (!user || !choice || !canBet) {
      setError('Invalid game setup');
      return;
    }

    setIsPlaying(true);
    setError('');
    setResult(null);

    try {
      // Call backend API
      const response = await fetch('/api/games/coinflip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          choice,
          betAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Game failed');
      }

      // Display result
      setResult({
        won: data.data.won,
        result: data.data.result,
        payout: data.data.payout
      });

      // Update wallet
      setWalletBalance(data.data.newBalance);
      const updatedUser = { ...user, walletBalance: data.data.newBalance };
      setUser(updatedUser);

      // Update local storage
      const transactionUser = addTransaction(
        data.data.won ? 'win' : 'loss',
        data.data.won ? data.data.payout : -betAmount,
        `Coin flip - ${data.data.result}`,
        'completed'
      );
      if (transactionUser) {
        setUser(transactionUser);
      }

      // Reload game history and stats
      loadGameHistory(user.id);
      loadGameStats(user.id);

      // Callback
      if (onGameComplete) {
        onGameComplete({ won: data.data.won, payout: data.data.payout });
      }
    } catch (err: any) {
      setError(err.message || 'Game error occurred');
    } finally {
      setIsPlaying(false);
    }
  };

  const handlePlayAgain = () => {
    setResult(null);
    setChoice(null);
    setBetAmount(100);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            Coin Flip Game
          </h1>
          <p className="mt-3 text-lg text-slate-400">Choose heads or tails and win 2x your bet</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr_1fr]">
          {/* Game Controls */}
          <section className="rounded-3xl border border-yellow-500/30 bg-slate-950/80 p-8 backdrop-blur-xl">
            <h2 className="mb-6 text-xl font-bold text-yellow-400">Game Controls</h2>

            {/* Wallet Balance */}
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4">
              <p className="text-sm text-slate-400">Available Balance</p>
              <p className="mt-2 text-3xl font-bold text-yellow-400">₦{walletBalance.toLocaleString()}</p>
            </div>

            {/* Choice Buttons */}
            <div className="mb-6 space-y-3">
              <button
                onClick={() => setChoice('heads')}
                disabled={isPlaying || result !== null}
                className={`w-full rounded-2xl py-4 font-bold text-lg transition ${
                  choice === 'heads'
                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50'
                    : 'border border-yellow-500/50 bg-black/50 text-yellow-400 hover:border-yellow-500'
                } disabled:opacity-50`}
              >
                🪙 Heads
              </button>
              <button
                onClick={() => setChoice('tails')}
                disabled={isPlaying || result !== null}
                className={`w-full rounded-2xl py-4 font-bold text-lg transition ${
                  choice === 'tails'
                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50'
                    : 'border border-yellow-500/50 bg-black/50 text-yellow-400 hover:border-yellow-500'
                } disabled:opacity-50`}
              >
                🪙 Tails
              </button>
            </div>

            {/* Bet Amount */}
            <label className="block mb-6">
              <span className="text-sm font-semibold text-yellow-400 uppercase">Bet Amount</span>
              <input
                type="number"
                min={10}
                step={10}
                max={walletAvailable}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                disabled={isPlaying || result !== null}
                className="mt-3 w-full rounded-2xl border border-yellow-500/30 bg-black/50 px-4 py-3 text-white outline-none focus:border-yellow-500 disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-slate-500">Min: ₦10 • Max: ₦{walletAvailable.toLocaleString()}</p>
            </label>

            {/* Play Button */}
            {!result ? (
              <button
                onClick={handlePlayGame}
                disabled={!canBet}
                className="w-full rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 py-4 font-bold text-lg text-black transition hover:from-yellow-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-yellow-500/30"
              >
                {isPlaying ? 'Flipping...' : `Play for ₦${betAmount.toLocaleString()}`}
              </button>
            ) : (
              <button
                onClick={handlePlayAgain}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-4 font-bold text-lg text-white transition hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/30"
              >
                Play Again
              </button>
            )}

            {error && <div className="mt-4 rounded-2xl bg-red-500/20 p-3 text-sm text-red-300">{error}</div>}
          </section>

          {/* Game Display */}
          <section className="rounded-3xl border border-yellow-500/30 bg-slate-950/80 p-8 backdrop-blur-xl flex flex-col items-center justify-center">
            {result ? (
              <div className="text-center space-y-6">
                <div className="text-8xl animate-bounce">{result.result === 'heads' ? '🪙' : '🎰'}</div>
                <div>
                  <h3 className={`text-3xl font-bold ${result.won ? 'text-green-400' : 'text-red-400'}`}>
                    {result.won ? '🎉 YOU WON!' : '😔 You Lost'}
                  </h3>
                  <p className="mt-3 text-2xl font-semibold text-yellow-400">₦{result.payout.toLocaleString()}</p>
                </div>
              </div>
            ) : choice ? (
              <div className="text-center space-y-6">
                <div id="coin-flip-canvas" className="mx-auto flex items-center justify-center" style={{ width: '300px', height: '300px' }}></div>
                <p className="text-xl text-slate-400">You chose: <span className="font-bold text-yellow-400">{choice.toUpperCase()}</span></p>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <p className="text-xl">Select Heads or Tails to begin</p>
              </div>
            )}
          </section>

          {/* Stats & History */}
          <section className="space-y-6">
            {/* Stats Card */}
            {stats && (
              <div className="rounded-3xl border border-yellow-500/30 bg-slate-950/80 p-6 backdrop-blur-xl">
                <h3 className="mb-4 text-lg font-bold text-yellow-400">Your Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Games:</span>
                    <span className="font-bold">{stats.totalGames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wins:</span>
                    <span className="font-bold text-green-400">{stats.wonGames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Losses:</span>
                    <span className="font-bold text-red-400">{stats.lostGames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Win Rate:</span>
                    <span className="font-bold text-yellow-400">{stats.winRate}%</span>
                  </div>
                  <div className="border-t border-yellow-500/20 pt-3 flex justify-between">
                    <span className="text-slate-400">Profit/Loss:</span>
                    <span className={`font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₦{stats.profit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Games */}
            <div className="rounded-3xl border border-yellow-500/30 bg-slate-950/80 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-bold text-yellow-400">Recent Games</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {gameHistory.length > 0 ? (
                  gameHistory.map((game) => (
                    <div key={game.id} className="flex items-center justify-between rounded-xl bg-black/50 p-3 text-xs">
                      <div>
                        <p className="font-semibold">{game.choice.toUpperCase()} - {game.result.toUpperCase()}</p>
                        <p className="text-slate-500">{new Date(game.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <span className={Number(game.winAmount) > 0 ? 'text-green-400 font-bold' : 'text-red-400'}>
                        {Number(game.winAmount) > 0 ? '+' : ''}{game.winAmount.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-4">No games yet</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
