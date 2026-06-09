"use client";
import React, { useEffect, useState } from 'react';
import { getStoredUser, StoredUser } from '@/lib/user';

const PLANS = [
  { days: 7, label: '7 days', rate: '2.5%' },
  { days: 30, label: '30 days', rate: '5%' },
  { days: 90, label: '90 days', rate: '12%' },
];

export default function StakingPage() {
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState(100);
  const [periodDays, setPeriodDays] = useState(7);
  const [stakes, setStakes] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPlan = PLANS.find((plan) => plan.days === periodDays);
  const reward = Number((amount * (periodDays === 7 ? 0.025 : periodDays === 30 ? 0.05 : 0.12)).toFixed(2));

  async function fetchStakes() {
    if (!userId) return;
    try {
      const res = await fetch(`/api/staking?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (res.ok) {
        setStakes(data);
        setMessage(null);
      } else {
        setMessage(data.error || 'Unable to load stakes');
      }
    } catch (error) {
      setMessage('Network error');
    }
  }

  async function handleStake() {
    if (!userId) return setMessage('Enter your user ID');
    if (amount <= 0) return setMessage('Stake amount must be greater than zero');

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/staking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stake', userId, amount, periodDays }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Staked ${amount} SofCoin for ${periodDays} days. Reward: ${reward} SofCoin.`);
        setTimeout(fetchStakes, 100);
      } else {
        setMessage(data.error || data.detail || 'Stake failed');
      }
    } catch (error) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnstake(stakeId: string) {
    if (!userId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/staking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unstake', userId, stakeId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Unstake processed. Released ${data.releaseAmount} SofCoin.`);
        setTimeout(fetchStakes, 100);
      } else {
        setMessage(data.error || data.detail || 'Unstake failed');
      }
    } catch (error) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setStoredUser(user);
      setUserId(user.id);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchStakes();
  }, [userId]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">SofCoin Staking</h1>
      <p className="mb-5 text-sm text-gray-600">
        Lock SofCoin for a fixed term and earn rewards. Smaller terms are more flexible; longer terms earn higher yield.
      </p>

      {storedUser ? (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 mb-6 text-sm text-green-100">
          Logged in as <strong>{storedUser.username || storedUser.email || storedUser.id}</strong>. Your staking actions will use this account.
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">User ID</label>
          <input className="w-full rounded border p-3" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Paste your user id" />
        </div>
      )}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Stake amount</label>
        <input type="number" className="w-full rounded border p-3" value={amount} min={1} onChange={(e) => setAmount(Number(e.target.value))} />
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-6">
        {PLANS.map((plan) => (
          <button
            key={plan.days}
            className={`p-4 rounded border text-left ${plan.days === periodDays ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
            onClick={() => setPeriodDays(plan.days)}
          >
            <div className="text-lg font-semibold">{plan.label}</div>
            <div className="text-sm text-slate-500">Reward {plan.rate}</div>
          </button>
        ))}
      </div>

      <div className="mb-6 p-4 rounded border bg-slate-50">
        <p className="text-sm">Selected plan: <strong>{selectedPlan?.label}</strong></p>
        <p className="text-sm">Estimated reward: <strong>{reward} SofCoin</strong></p>
        <p className="text-sm">Payout at maturity: <strong>{amount + reward} SofCoin</strong></p>
      </div>

      <div className="flex gap-3 mb-6">
        <button className="rounded bg-blue-600 px-5 py-3 text-white" onClick={handleStake} disabled={loading}>{loading ? 'Processing...' : 'Stake SofCoin'}</button>
        <button className="rounded border px-5 py-3" onClick={fetchStakes}>Refresh Stakes</button>
      </div>

      {message && <div className="mb-6 rounded border border-blue-200 bg-blue-50 p-4 text-sm text-slate-800">{message}</div>}

      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Stakes</h2>
        {stakes.length === 0 ? (
          <div className="text-sm text-slate-500">No active stakes yet.</div>
        ) : (
          <div className="space-y-4">
            {stakes.map((stake) => {
              const isMature = new Date() >= new Date(stake.endAt);
              return (
                <div key={stake.id} className="rounded border p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold">{stake.stakePlan} Stake</div>
                      <div className="text-sm text-slate-500">{stake.amount} SofCoin staked</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Status</div>
                      <div className="font-semibold">{stake.status}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-slate-600">
                    <div>Reward: {stake.reward} SofCoin</div>
                    <div>Ends: {new Date(stake.endAt).toLocaleDateString()}</div>
                    <div>Mature: {isMature ? 'Yes' : 'No'}</div>
                    <div>Payout: {stake.payoutAmount} SofCoin</div>
                  </div>
                  {stake.status === 'active' && (
                    <div className="mt-4 flex justify-end">
                      <button className="rounded bg-green-600 px-4 py-2 text-white" onClick={() => handleUnstake(stake.id)}>
                        Claim / Unstake
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
