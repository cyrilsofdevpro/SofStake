'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addTransaction, getStoredUser, updateUserStats, StoredUser, getFriends } from '@/lib/user';

type GameType = 'dice' | 'wheel';

type GameState = 'idle' | 'searching' | 'ready' | 'completed';

const opponents = ['Shadow', 'Nova', 'Apex', 'Rogue', 'Viper', 'Oracle'];

function randomFromRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function GamePage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [friends, setFriends] = useState<StoredUser[]>([]);
  const [gameType, setGameType] = useState<GameType>('dice');
  const [stake, setStake] = useState(100);
  const [state, setState] = useState<GameState>('idle');
  const [message, setMessage] = useState('Choose a game and stake to begin.');
  const [opponent, setOpponent] = useState('Rival');
  const [result, setResult] = useState('');
  const [playerScore, setPlayerScore] = useState<number | null>(null);
  const [opponentScore, setOpponentScore] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth');
      return;
    }

    setUser(storedUser);
    setFriends(getFriends());
  }, [router]);

  const canPlay = Boolean(user && stake >= 100 && stake <= user.walletBalance);

  const gameLabel = useMemo(() => {
    return gameType === 'dice' ? 'Dice Battle' : 'Wheel Game';
  }, [gameType]);

  const handleStartMatch = () => {
    if (!user) return;
    if (stake < 100) {
      setMessage('Minimum stake is ₦100.');
      return;
    }
    if (stake > user.walletBalance) {
      setMessage('You do not have enough balance. Deposit more to play.');
      return;
    }

    const matchOpponent = opponents[randomFromRange(0, opponents.length - 1)];
    setOpponent(matchOpponent);
    setState('searching');
    setMessage('Searching for an opponent...');
    setResult('');
    setPlayerScore(null);
    setOpponentScore(null);

    setTimeout(() => {
      setState('ready');
      setMessage(`Match found against ${matchOpponent}! Ready to ${gameType === 'dice' ? 'roll' : 'spin'}.`);
      const stakeUser = addTransaction('loss', -stake, `${gameLabel} stake deducted`);
      if (stakeUser) {
        setUser(stakeUser);
      }
    }, 1400);
  };

  const handlePlay = () => {
    if (!user || state !== 'ready') return;

    const playerValue = gameType === 'dice' ? randomFromRange(1, 6) : randomFromRange(10, 100);
    const opponentValue = gameType === 'dice' ? randomFromRange(1, 6) : randomFromRange(10, 100);
    setPlayerScore(playerValue);
    setOpponentScore(opponentValue);

    let outcomeMessage = '';
    let updatedUser = { ...user };
    const fee = 0.1;
    const payout = Math.floor(stake * 2 * (1 - fee));
    let won = false;

    if (playerValue === opponentValue) {
      outcomeMessage = `Tie! ${gameLabel} ended in a draw. Your stake was refunded.`;
      const refundUser = addTransaction('deposit', stake, `${gameLabel} stake returned after tie`);
      if (refundUser) {
        updatedUser = refundUser;
      }
    } else if (playerValue > opponentValue) {
      outcomeMessage = `You won! ${gameLabel} payout ₦${payout.toLocaleString()} delivered.`;
      const winUser = addTransaction('win', payout, `Won ${gameLabel} payout`);
      if (winUser) {
        updatedUser = winUser;
      }
      won = true;
    } else {
      outcomeMessage = `You lost ₦${stake.toLocaleString()} in this round. Better luck next time.`;
    }

    // Update user stats with preserved wallet balance
    const statsUpdatedUser = updateUserStats(updatedUser, won);
    if (statsUpdatedUser) {
      updatedUser = statsUpdatedUser;
    }

    setUser(updatedUser);
    setState('completed');
    setMessage(outcomeMessage);
  };

  const handleReset = () => {
    setState('idle');
    setMessage('Choose a game and stake to begin.');
    setPlayerScore(null);
    setOpponentScore(null);
    setOpponent('Rival');
  };

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent">Game System</p>
            <h1 className="mt-3 text-4xl font-semibold">Real-time game arena</h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              Start with simple multiplayer-style games: Dice Battle and Wheel Game. Stakes are deducted up front, and outcomes are resolved instantly.
            </p>
          </div>
          <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-accent">
            Back to dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-white/10 bg-surface/80 p-8 shadow-glow backdrop-blur-xl">
            <div className="grid gap-6">
              <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Selected game</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{gameLabel}</h2>
                  </div>
                  <div className="rounded-full bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.25em] text-slate-200">
                    {user ? `Balance ₦${user.walletBalance.toLocaleString()}` : 'Loading...'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setGameType('dice')}
                    className={`rounded-full px-4 py-3 text-sm font-semibold transition ${gameType === 'dice' ? 'bg-accent text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
                  >
                    Dice Battle
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameType('wheel')}
                    className={`rounded-full px-4 py-3 text-sm font-semibold transition ${gameType === 'wheel' ? 'bg-accent text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
                  >
                    Wheel Game
                  </button>
                </div>
                <p className="text-sm text-slate-300">
                  {gameType === 'dice'
                    ? 'Two players roll dice (1–6). Highest roll wins. Ties refund the stake.'
                    : 'Spin-to-win with random scores from 10 to 100. Higher score wins.'}
                </p>
              </div>

              <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <label className="text-sm uppercase tracking-[0.25em] text-slate-400">Stake amount</label>
                <input
                  type="number"
                  min={100}
                  value={stake}
                  onChange={(event) => setStake(Number(event.target.value))}
                  className="w-full rounded-3xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-accent"
                />
                <p className="text-sm text-slate-500">Minimum stake ₦100. Win payout is calculated after a 10% fee.</p>
              </div>

              <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Match status</p>
                    <p className="mt-2 text-xl font-semibold text-white capitalize">{state}</p>
                  </div>
                  <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200">Opponent: {opponent}</div>
                </div>
                <p className="text-sm text-slate-300">{message}</p>
                {playerScore !== null && opponentScore !== null && (
                  <div className="grid gap-3 rounded-3xl bg-black/30 p-4 text-sm text-slate-200">
                    <div className="flex items-center justify-between">
                      <span>Your {gameType === 'dice' ? 'roll' : 'score'}</span>
                      <span>{playerScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{opponent}'s {gameType === 'dice' ? 'roll' : 'score'}</span>
                      <span>{opponentScore}</span>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleStartMatch}
                    disabled={!canPlay || state === 'searching' || state === 'ready'}
                    className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Find match
                  </button>
                  <button
                    type="button"
                    onClick={handlePlay}
                    disabled={state !== 'ready'}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {gameType === 'dice' ? 'Roll dice' : 'Spin wheel'}
                  </button>
                </div>
                {state === 'completed' && (
                  <div className="space-y-4">
                    <div className="flex justify-center gap-2">
                      <button className="rounded-full bg-yellow-500 p-3 text-2xl transition hover:bg-yellow-400">😊</button>
                      <button className="rounded-full bg-red-500 p-3 text-2xl transition hover:bg-red-400">😢</button>
                      <button className="rounded-full bg-blue-500 p-3 text-2xl transition hover:bg-blue-400">🔥</button>
                      <button className="rounded-full bg-green-500 p-3 text-2xl transition hover:bg-green-400">💪</button>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-accent"
                    >
                      Play again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-glow">
              <p className="text-sm uppercase tracking-[0.35em] text-accent">Friends</p>
              <div className="mt-6 space-y-3">
                {friends.length === 0 ? (
                  <p className="text-sm text-slate-400">No friends yet. Add some in the Friends page!</p>
                ) : (
                  friends.slice(0, 5).map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between rounded-3xl bg-black/30 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-bold text-white">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-white">{friend.username}</span>
                      </div>
                      <button className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-slate-950 transition hover:bg-accent2">
                        Invite
                      </button>
                    </div>
                  ))
                )}
                {friends.length > 5 && (
                  <p className="text-center text-sm text-slate-400">+{friends.length - 5} more</p>
                )}
              </div>
              <Link href="/friends" className="mt-4 inline-block w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-sm font-semibold text-white transition hover:border-accent">
                Manage Friends
              </Link>
            </div>
            <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-glow">
              <p className="text-sm uppercase tracking-[0.35em] text-accent">Need more balance?</p>
              <p className="mt-4 text-slate-300">Go to your wallet to deposit funds and get back into the game.</p>
              <button
                type="button"
                onClick={() => router.push('/wallet')}
                className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-500"
              >
                Open wallet
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
