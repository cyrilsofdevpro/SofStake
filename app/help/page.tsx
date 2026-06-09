'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/user';
import { ChevronDown } from 'lucide-react';

export default function HelpPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth');
      return;
    }
    setUser(storedUser);
  }, [router]);

  if (!user) return <div>Loading...</div>;

  const faqs = [
    {
      q: 'How do I get started?',
      a: 'Create an account, verify your email, and deposit funds to start playing games and earning SofCoins.'
    },
    {
      q: 'What are SofCoins?',
      a: 'SofCoins are the internal platform currency earned through gameplay, daily logins, and referrals. They can be traded on the marketplace.'
    },
    {
      q: 'How does the mining system work?',
      a: 'Users earn rewards through daily logins, game completion, referrals, and event participation. This is controlled engagement mining, not blockchain mining.'
    },
    {
      q: 'Can I withdraw my earnings?',
      a: 'Yes, withdrawals are available in controlled phases. Once your account reaches certain milestones, you can request withdrawals.'
    },
    {
      q: 'How do tournaments work?',
      a: 'Tournaments run regularly with different entry requirements and prize pools. Compete against other players to win rewards.'
    },
    {
      q: 'Is there a referral program?',
      a: 'Yes! Share your referral code and earn bonuses when friends join and play. Check the Referrals page for details.'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Help Center</h1>
        <p className="text-slate-400">Find answers to common questions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 p-6">
          <h3 className="font-semibold text-lg mb-2">📚 Getting Started</h3>
          <p className="text-sm text-slate-400">Learn the basics of SofStake</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-6">
          <h3 className="font-semibold text-lg mb-2">💬 Support</h3>
          <p className="text-sm text-slate-400">Contact our support team</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 p-6">
          <h3 className="font-semibold text-lg mb-2">📖 Documentation</h3>
          <p className="text-sm text-slate-400">Read detailed guides</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-xl bg-slate-900/50 border border-white/5 overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-left">{faq.q}</span>
                <ChevronDown
                  size={20}
                  className={`transition-transform ${expandedFAQ === idx ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedFAQ === idx && (
                <div className="px-6 pb-6 border-t border-white/5 text-slate-300">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 p-6">
        <h3 className="font-semibold text-lg mb-3">Still need help?</h3>
        <p className="text-slate-400 mb-4">Can't find what you're looking for? Contact our support team.</p>
        <button className="px-6 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors font-semibold">
          Contact Support
        </button>
      </div>
    </div>
  );
}
