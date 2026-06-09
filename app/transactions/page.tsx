'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/user';

export default function TransactionsPage() {
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
        <h1 className="text-4xl font-bold mb-2">Transactions</h1>
        <p className="text-slate-400">View all your transaction history</p>
      </div>

      <div className="rounded-xl bg-slate-900/50 border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-slate-800/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                No transactions yet. Start playing to earn rewards!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
