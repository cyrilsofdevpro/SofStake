'use client';

import { useEffect, useMemo, useState } from 'react';
import { getStoredUser, addTransaction, StoredUser } from '@/lib/user';
import { startMinesRound, revealMinesTile, cashoutMinesRound } from '@/lib/games/mines';

type TileState = 'hidden' | 'safe' | 'mine';

type Phase = 'setup' | 'playing' | 'won' | 'lost';

const createTileGrid = (size: number) => Array.from({ length: size * size }, () => 'hidden' as TileState);

export default function MinesGame() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [gridSize, setGridSize] = useState(5);
  const [mineCount, setMineCount] = useState(5);
  const [tiles, setTiles] = useState<TileState[]>(createTileGrid(5));
  const [roundId, setRoundId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [multiplier, setMultiplier] = useState(1);
  const [message, setMessage] = useState('Select your bet and grid to start');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const gridColumnsStyle = useMemo(
    () => ({ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }),
    [gridSize]
  );

  const revealedCount = tiles.filter((tile) => tile === 'safe').length;
  const canStart = betAmount >= 50 && betAmount <= walletBalance && phase === 'setup';
  const canCashout = phase === 'playing' && roundId !== null;

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setWalletBalance(storedUser.walletBalance);
    }
  }, []);

  useEffect(() => {
    setTiles(createTileGrid(gridSize));
    setMineCount(gridSize === 5 ? 5 : 8);
  }, [gridSize]);

  const startGame = async () => {
    if (!user) {
      setError('Please log in before playing');
      return;
    }

    if (betAmount < 50) {
      setError('Minimum bet is ₦50');
      return;
    }

    if (betAmount > walletBalance) {
      setError('Insufficient wallet balance');
      return;
    }

    setError('');
    setMessage('Starting round...');
    setIsProcessing(true);

    try {
      const result = await startMinesRound({
        userId: user.id,
        betAmount,
        gridSize,
        mineCount
      });

      setRoundId(result.roundId);
      setTiles(createTileGrid(result.gridSize));
      setPhase('playing');
      setMultiplier(result.multiplier);
      setMessage('Tap a tile to reveal safely. Cash out anytime.');
      setWalletBalance((prev) => prev - result.betAmount);

      const updated = addTransaction('withdraw', -result.betAmount, `Mines bet placed (${result.gridSize}x${result.gridSize})`, 'completed');
      if (updated) {
        setUser(updated);
        setWalletBalance(updated.walletBalance);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start round');
    } finally {
      setIsProcessing(false);
    }
  };

  const revealTile = async (index: number) => {
    if (!user || !roundId || phase !== 'playing' || tiles[index] !== 'hidden' || isProcessing) {
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      const result = await revealMinesTile(user.id, roundId, index);

      if (result.result === 'lost') {
        setTiles((current) => {
          const next = [...current];
          next[index] = 'mine';
          if (result.mineIndices) {
            result.mineIndices.forEach((mineIndex) => {
              next[mineIndex] = 'mine';
            });
          }
          return next;
        });
        setPhase('lost');
        setMultiplier(0);
        setMessage('💥 Boom! You hit a mine. Better luck next round.');
      } else {
        setTiles((current) => {
          const next = [...current];
          next[index] = 'safe';
          return next;
        });
        setMultiplier(result.multiplier);
        setMessage(`✅ Safe! Current multiplier ${result.multiplier}x`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reveal tile');
    } finally {
      setIsProcessing(false);
    }
  };

  const cashout = async () => {
    if (!user || !roundId || phase !== 'playing') return;

    setError('');
    setIsProcessing(true);

    try {
      const result = await cashoutMinesRound(user.id, roundId);
      setPhase('won');
      setMultiplier(result.multiplier);
      setMessage(`🎉 Cashout successful! You won ₦${result.payout.toLocaleString()} at ${result.multiplier}x`);
      setWalletBalance(result.newBalance);

      const updated = addTransaction('win', result.payout, `Mines cashout ${result.multiplier}x`, 'completed');
      if (updated) {
        setUser(updated);
        setWalletBalance(updated.walletBalance);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cash out');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetRound = () => {
    setRoundId(null);
    setPhase('setup');
    setTiles(createTileGrid(gridSize));
    setMultiplier(1);
    setMessage('Select your bet and grid to start');
    setError('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
            💣 Mines Game
          </h1>
          <p className="mt-3 text-lg text-slate-400">
            Reveal safe tiles, scale your multiplier, and cash out before hitting a mine.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-700/70 bg-slate-950/80 p-8 backdrop-blur-xl">
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Wallet Balance</p>
                <p className="mt-3 text-3xl font-bold text-cyan-300">₦{walletBalance.toLocaleString()}</p>
              </div>

              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Current Multiplier</p>
                <p className="mt-3 text-3xl font-bold text-emerald-400">{multiplier.toFixed(2)}x</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Bet Amount</span>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={betAmount}
                    disabled={phase !== 'setup' || isProcessing}
                    onChange={(event) => setBetAmount(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Grid Size</span>
                  <select
                    value={gridSize}
                    disabled={phase !== 'setup' || isProcessing}
                    onChange={(event) => setGridSize(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  >
                    <option value={5}>5 x 5</option>
                    <option value={6}>6 x 6</option>
                  </select>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-300">Mine Count</span>
                <select
                  value={mineCount}
                  disabled={phase !== 'setup' || isProcessing}
                  onChange={(event) => setMineCount(Number(event.target.value))}
                  className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  {gridSize === 5 ? (
                    <>
                      <option value={5}>5 Mines</option>
                      <option value={6}>6 Mines</option>
                      <option value={7}>7 Mines</option>
                    </>
                  ) : (
                    <>
                      <option value={8}>8 Mines</option>
                      <option value={9}>9 Mines</option>
                      <option value={10}>10 Mines</option>
                    </>
                  )}
                </select>
              </label>

              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-sm text-slate-400">Safe tiles revealed</p>
                <p className="mt-2 text-3xl font-bold text-emerald-400">{revealedCount}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {phase !== 'playing' ? (
                <button
                  onClick={startGame}
                  disabled={!canStart || isProcessing}
                  className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-4 text-lg font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? 'Starting...' : `Start Round for ₦${betAmount.toLocaleString()}`}
                </button>
              ) : (
                <button
                  onClick={cashout}
                  disabled={!canCashout || isProcessing}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-4 text-lg font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? 'Cashing out...' : 'Cash Out Now'}
                </button>
              )}

              <button
                onClick={resetRound}
                disabled={isProcessing}
                className="rounded-2xl border border-slate-600 bg-slate-900/90 px-5 py-4 text-lg font-semibold text-white transition hover:border-slate-400"
              >
                Reset Round
              </button>
            </div>

            {error && <div className="mt-6 rounded-2xl bg-red-500/20 p-4 text-sm text-red-200">{error}</div>}
            {message && !error && <div className="mt-6 rounded-2xl bg-slate-900/80 p-4 text-sm text-slate-300">{message}</div>}
          </section>

          <section className="rounded-3xl border border-slate-700/70 bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Minefield</h2>
                <p className="text-sm text-slate-400">Reveal hidden tiles and avoid mines.</p>
              </div>
              <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                {gridSize}x{gridSize}
              </span>
            </div>

            <div className="grid gap-2" style={gridColumnsStyle}>
              {tiles.map((tile, index) => (
                <button
                  key={`${gridSize}-${index}-${tile}`}
                  type="button"
                  onClick={() => revealTile(index)}
                  disabled={phase !== 'playing' || tile !== 'hidden' || isProcessing}
                  className={`aspect-square rounded-2xl border text-xl font-bold transition focus:outline-none ${
                    tile === 'hidden'
                      ? 'border-slate-700 bg-slate-900/90 text-slate-300 hover:border-cyan-400 hover:bg-slate-800'
                      : tile === 'safe'
                      ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500 bg-rose-500/15 text-rose-300'
                  } ${phase !== 'playing' || tile !== 'hidden' ? 'cursor-not-allowed opacity-90' : ''}`}
                >
                  {tile === 'hidden' ? '' : tile === 'safe' ? '✓' : '💣'}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Mine Count</span>
                <span>{mineCount}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                <span>Win Target</span>
                <span>{(multiplier * betAmount).toLocaleString()}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
