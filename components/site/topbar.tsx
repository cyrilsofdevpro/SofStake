'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, MessageSquare, Settings, Menu, X } from 'lucide-react';
import { sidebarItems } from './sidebar';
import { getStoredUser } from '@/lib/user';

const topbarItems = [
  { href: '/dashboard', label: 'Home' },
  { href: '/game', label: 'Sports' },
  { href: '/market', label: 'Casino' },
  { href: '/game', label: 'Crash' },
  { href: '/dashboard', label: 'Tournament' },
  { href: '/explore', label: 'Mines' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/wallet', label: 'Rewards' }
];

export function Topbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(3);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
  }, []);

  // Don't show topbar on landing page
  if (pathname === '/') {
    return null;
  }

  const normalizedPath = pathname === '/dashboard' ? '/dashboard' : pathname;

  return (
    <>
      {/* Desktop header */}
      <header className="hidden md:block fixed top-0 left-0 right-0 h-20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-white/10 backdrop-blur-xl z-40">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600">
                <span className="text-white font-bold text-lg">SF</span>
              </div>
              <span className="text-lg font-bold text-white hidden sm:inline">SofStake</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2 px-2 py-2">
            {topbarItems.map((item) => {
              const isActive = normalizedPath === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full border px-3 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white">
            <Bell size={20} />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white">
            <MessageSquare size={20} />
          </button>

          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white">
            <Settings size={20} />
          </button>

          <Link
            href="/profile"
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 hover:from-cyan-500/20 hover:to-purple-500/20 border border-cyan-500/20 transition-all text-slate-300 hover:text-white"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium">{user?.username || 'User'}</span>
          </Link>
        </div>
      </div>
      </header>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-white/10 backdrop-blur-xl z-40 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600">
            <span className="text-white font-bold text-sm">SF</span>
          </div>
        </Link>
        <button
          aria-label="Open menu"
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300 hover:text-white"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 bg-gradient-to-b from-slate-950 to-slate-900 border-r border-white/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600">
                  <span className="text-white font-bold text-lg">SF</span>
                </div>
                <span className="text-lg font-bold text-white">SofStake</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-white/5 text-slate-300">
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <Icon size={20} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            className="flex-1 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}
    </>
  );
}
