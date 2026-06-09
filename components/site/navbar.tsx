'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home,
  Gamepad2,
  Users,
  Share2,
  Trophy,
  Wallet,
  TrendingUp,
  User,
  Shield,
  Activity,
  MessageCircle
} from 'lucide-react';
import { LiveChat } from '@/components/LiveChat';
import { LiveActivityFeed } from '@/components/LiveActivityFeed';
import { getStoredUser } from '@/lib/user';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/game', label: 'Game', icon: Gamepad2 },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/referrals', label: 'Referrals', icon: Share2 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard', label: 'Stats', icon: TrendingUp },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/admin', label: 'Admin', icon: Shield, adminOnly: true }
];

export function Navbar() {
  const pathname = usePathname();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<{ username: string; avatar: string; badges: string[] } | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser({ username: storedUser.username, avatar: storedUser.avatar || 'SF', badges: storedUser.badges });
      if (storedUser.badges.includes('Admin')) {
        setIsAdmin(true);
      }
    }
  }, []);

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3 text-base font-semibold text-accent">
            <span className="flex h-10 w-10 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-900 to-cyan-500 text-white">SF</span>
            <span className="hidden sm:inline">SofStake</span>
          </Link>

          <div className="flex-1 min-w-[14rem]">
            <nav className="flex flex-wrap items-center justify-center gap-2 px-2 py-1">
              {filteredNavItems.map((item) => {
                const IconComponent = item.icon;
                const active = pathname === item.href || (pathname !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                      active
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:border-accent hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <IconComponent size={16} strokeWidth={1.5} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsActivityOpen(!isActivityOpen)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-accent hover:bg-white/10 hover:text-accent"
              title="Live Activity"
            >
              <Activity size={20} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-accent hover:bg-white/10 hover:text-accent"
              title="Global Chat"
            >
              <MessageCircle size={20} strokeWidth={1.5} />
            </button>
            <div className="hidden md:flex h-11 min-w-[3rem] items-center justify-center rounded-full bg-white/5 px-3 text-sm font-semibold text-slate-200">
              {user?.avatar ? user.avatar.charAt(0).toUpperCase() : 'S'}
            </div>
          </div>
        </div>

      </header>

      <LiveChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <LiveActivityFeed isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} />
    </>
  );
}
