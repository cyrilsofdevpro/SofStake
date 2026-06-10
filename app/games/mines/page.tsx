import MinesGame from '@/components/games/MinesGame';
import Link from 'next/link';

export const metadata = {
  title: 'Mines Game | SofStake',
  description: 'Play the Mines game and avoid hidden mines to win multipliers.'
};

export default function MinesPage() {
  return (
    <>
      <div
        className="relative overflow-hidden bg-slate-950 text-white"
        style={{ backgroundImage: "url('/betting-images/MINES%20GAME%20image.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-slate-950/85" />
        <div className="relative mx-auto max-w-7xl px-6 py-10 sm:py-14">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
            <div className="space-y-4 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Mines Game</p>
              <h1 className="text-4xl font-bold text-white sm:text-5xl">Avoid the mines, cash out early</h1>
              <p className="mx-auto max-w-2xl text-slate-300">
                The Mines page is now enhanced with your custom Mines game artwork for a stronger casino aesthetic.
              </p>
            </div>
          </div>
        </div>
      </div>

      <MinesGame />

      <div className="flex justify-center py-8">
        <Link
          href="/games"
          className="rounded-full border border-cyan-500/50 bg-black/50 px-6 py-3 font-semibold text-cyan-300 transition hover:border-cyan-500 hover:bg-cyan-500/10"
        >
          ← Back to Games
        </Link>
      </div>
    </>
  );
}
