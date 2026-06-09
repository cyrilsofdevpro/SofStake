'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Gamepad2,
  Dice5,
  Wallet,
  User
} from 'lucide-react';

const bottomNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/game', label: 'Games', icon: Gamepad2 },
  { href: '/market', label: 'Bet', icon: Dice5 },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: User }
];

export function BottomNav() {
  const pathname = usePathname();

  // Don't show on landing page or auth pages
  if (pathname === '/' || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-white/10 backdrop-blur-xl z-40 flex items-center justify-around px-2">
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href);
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
              isActive
                ? 'text-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
