'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getTransactionHistory, Transaction } from '@/lib/user';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth');
      return;
    }

    setTransactions(getTransactionHistory(50));
  }, [router]);

  if (!transactions) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Transactions</h1>
        <p className="text-slate-400">View all your transaction history</p>
      </div>

      <div className="rounded-xl bg-slate-900/50 border border-white/5 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-slate-800/50">
              <th className="px-6 py-3 text-xs font-semibold uppercase">Type</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase">Description</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase">Amount</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-semibold uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr className="border-b border-white/5">
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                  No transactions yet. Start playing to earn rewards!
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-6 py-4 text-slate-200 capitalize">{transaction.type.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-slate-300">{transaction.description}</td>
                  <td className={`px-6 py-4 font-semibold ${transaction.amount >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {transaction.amount >= 0 ? '+' : '-'}₦{Math.abs(transaction.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-400 uppercase">{transaction.status ?? 'completed'}</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(transaction.timestamp).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
