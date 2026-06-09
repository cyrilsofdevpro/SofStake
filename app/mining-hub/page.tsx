"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, StoredUser } from '@/lib/user';

export default function MiningHubPage() {
  const router = useRouter();
  const [storedUser, setStoredUser] = useState<StoredUser | null>(null);
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [lastAmount, setLastAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextPreview, setNextPreview] = useState('2 SofCoin');

  useEffect(()=>{
    const user = getStoredUser();
    if (user) {
      setStoredUser(user);
      setUserId(user.id);
    }
    setNextPreview('Day 1: 2, Day 2-6: 2-3, Day 7: 10-20');
  },[]);

  async function claim() {
    if (!userId) return setMessage('Enter userId');
    setLoading(true); setMessage(null);
    try {
      const fingerprint = await getDeviceFingerprint();
      const res = await fetch('/api/mining/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, deviceFingerprint: fingerprint }) });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Claimed ${data.amount} SofCoin (streak ${data.streak})`);
        setLastAmount(data.amount);
        setStreak(data.streak);
      } else {
        setMessage(data.error || data.detail || 'Failed to claim');
      }
    } catch (e) {
      setMessage('Network error');
    } finally { setLoading(false); }
  }

  async function getDeviceFingerprint() {
    // Lightweight fingerprint: userAgent + platform + random saved id
    try {
      let id = localStorage.getItem('sof_device_id');
      if (!id) { id = `${navigator.userAgent}_${navigator.platform}_${Math.random().toString(36).slice(2,8)}`; localStorage.setItem('sof_device_id', id); }
      return id;
    } catch { return `nodev_${Math.random().toString(36).slice(2,8)}`; }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mining Hub</h1>

      <p className="mb-4 text-sm text-gray-600">Daily login rewards and mining streaks. Claim once every 24 hours. Weekly cap: 20 SofCoin.</p>

      {storedUser ? (
        <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-100">
          Logged in as <strong>{storedUser.username || storedUser.email || storedUser.id}</strong>. Your claim will use your active account.
        </div>
      ) : (
        <>
          <label className="block mb-2">User ID (dev)</label>
          <input className="w-full mb-4 p-2 border rounded" value={userId} onChange={e=>setUserId(e.target.value)} placeholder="Your user id" />
        </>
      )}

      <div className="mb-4">
        <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={claim} disabled={loading}>{loading ? 'Claiming...' : 'Claim Daily Reward'}</button>
      </div>

      {message && <div className="mb-4 text-sm text-indigo-700">{message}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm">Current Streak</div>
          <div className="text-xl font-bold">{streak ?? '—'}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm">Last Claim</div>
          <div className="text-xl font-bold">{lastAmount ?? '—'} Sof</div>
        </div>
      </div>

      <div className="mt-6 p-4 border rounded">
        <div className="font-medium mb-2">Next reward preview</div>
        <div className="text-sm text-gray-700">{nextPreview}</div>
      </div>
    </div>
  );
}
