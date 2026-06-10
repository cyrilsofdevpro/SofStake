import SlotMachine from '@/components/games/SlotMachine';
import Link from 'next/link';

export const metadata = {
  title: 'Slot Machine | SofStake',
  description: 'Play the slot machine game with server-controlled reels and payouts.'
};

const PREVIEW_IMAGES = [
  '/betting-images/img1.jpg',
  '/betting-images/img2.jpg',
  '/betting-images/img3.jpg'
];

export default function SlotPage() {
  return (
    <>
      <div
        className="relative overflow-hidden bg-slate-950 text-white"
        style={{ backgroundImage: "url('/betting-images/SLOT%20MACHINE%20ENGINE%20image.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-slate-950/85" />
        <div className="relative mx-auto max-w-7xl px-6 py-10 sm:py-14">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-fuchsia-500/10 backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-300">Slot machine</p>
                <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">
                  Slot Machine Engine
                </h1>
                <p className="mt-4 max-w-2xl text-slate-300">
                  Enjoy a rich casino-style slot page with the new betting artwork as the hero background.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 rounded-3xl bg-slate-900/80 p-3 sm:max-w-xs">
                {PREVIEW_IMAGES.map((src) => (
                  <div key={src} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80">
                    <img src={src} alt="Slot game background preview" className="h-24 w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SlotMachine />

      <div className="flex justify-center py-8">
        <Link
          href="/games"
          className="rounded-full border border-fuchsia-500/50 bg-black/50 px-6 py-3 font-semibold text-fuchsia-300 transition hover:border-fuchsia-500 hover:bg-fuchsia-500/10"
        >
          ← Back to Games
        </Link>
      </div>
    </>
  );
}
