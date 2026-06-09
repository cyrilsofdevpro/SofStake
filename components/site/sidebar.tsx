'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Gamepad2,
  Compass,
  History,
  TrendingUp,
  Coins,
  TrendingDown,
  BarChart3,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useState } from 'react';

export const sidebarItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/game', label: 'Games', icon: Gamepad2 },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/transactions', label: 'Transactions', icon: History },
  { href: '/stats', label: 'Stats', icon: TrendingUp },
  { href: '/market', label: 'Market', icon: Coins },
  { href: '/crypto-market', label: 'Crypto Market', icon: TrendingDown },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/help', label: 'Help Center', icon: HelpCircle }
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  // Don't show sidebar on landing page
  if (pathname === '/') {
    return null;
  }

  return (
    <aside className={`hidden md:block md:fixed md:left-0 md:top-0 md:h-screen md:bg-gradient-to-b md:from-slate-950 md:to-slate-900 md:border-r md:border-white/10 md:pt-20 transition-all duration-300 ${
      isOpen ? 'md:w-64' : 'md:w-20'
    } md:overflow-y-auto md:z-30`}>
      <nav className="flex flex-col gap-2 px-4 py-6">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
              title={isOpen ? '' : item.label}
            >
              <Icon size={20} className="flex-shrink-0" />
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="absolute bottom-6 left-0 right-0 px-4">
        <button
          onClick={() => {
            // Handle logout
            window.location.href = '/api/auth/logout';
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200 ${
            !isOpen && 'justify-center'
          }`}
        >
          <LogOut size={20} />
          {isOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
