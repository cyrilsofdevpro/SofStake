import CoinFlipGame from '@/components/games/CoinFlipGame';
import Link from 'next/link';

export const metadata = {
  title: 'Coin Flip Game | SofStake',
  description: 'Play the coin flip game and win 2x your bet'
};

export default function CoinFlipPage() {
  return (
    <>
      <div
        className="relative overflow-hidden bg-slate-950 text-white"
        style={{ backgroundImage: "url('/betting-images/Coin%20flip%20image.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-slate-950/85" />
        <div className="relative mx-auto max-w-7xl px-6 py-10 sm:py-14">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-yellow-500/10 backdrop-blur-xl">
            <div className="space-y-4 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">Coin Flip</p>
              <h1 className="text-4xl font-bold text-white sm:text-5xl">Flip the coin and double up</h1>
              <p className="mx-auto max-w-2xl text-slate-300">
                Your Coin Flip page now uses the new betting asset artwork as its hero background.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CoinFlipGame />

      <div className="flex justify-center py-8">
        <Link
          href="/game"
          className="rounded-full border border-yellow-500/50 bg-black/50 px-6 py-3 font-semibold text-yellow-400 transition hover:border-yellow-500 hover:bg-yellow-500/10"
        >
          ← Back to Games
        </Link>
      </div>
    </>
  );
}
