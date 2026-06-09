'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/user';

export default function ExplorePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth');
      return;
    }
    setUser(storedUser);
  }, [router]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Explore</h1>
        <p className="text-slate-400">Discover new games, events, and opportunities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Live Events', desc: 'Join ongoing tournaments' },
          { title: 'Featured Games', desc: 'Top trending games' },
          { title: 'New Releases', desc: 'Latest game additions' },
          { title: 'Community Events', desc: 'Special competitions' },
          { title: 'Seasonal Rewards', desc: 'Limited time offers' },
          { title: 'Partner Games', desc: 'Exclusive partnerships' }
        ].map((item) => (
          <div key={item.title} className="rounded-xl bg-slate-900/50 border border-white/5 p-6 hover:border-cyan-500/30 transition-colors cursor-pointer">
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-sm text-slate-400 mt-2">{item.desc}</p>
            <button className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
              Explore →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
