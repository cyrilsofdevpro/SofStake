"use client";
import React, { useState, useEffect } from 'react';

const SOF_PER_USD = 200;

export default function BuySofCoinPage() {
  const [usd, setUsd] = useState<number>(1);
  const [sof, setSof] = useState<number>(SOF_PER_USD);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [sofBalance, setSofBalance] = useState<number | null>(null);

  useEffect(() => {
    setSof(Number((usd * SOF_PER_USD).toFixed(2)));
  }, [usd]);

  useEffect(() => {
    setUsd(Number((sof / SOF_PER_USD).toFixed(2)));
  }, [sof]);

  async function fetchBalance() {
    if (!userId) return setMessage('Enter userId to fetch balance');
    try {
      const res = await fetch(`/api/wallet?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (res.ok) {
        setSofBalance(data.sofBalance ?? 0);
        setMessage(null);
      } else setMessage(data.error || 'Failed to fetch');
    } catch (e) {
      setMessage('Network error');
    }
  }

  async function handleBuy() {
    if (!userId) return setMessage('Enter userId for the purchase');
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'buy', userId, amountUsd: usd }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Purchase complete: +${data.sof} SofCoin`);
        setSofBalance(data.sofBalance ?? null);
      } else {
        setMessage(data.error || 'Purchase failed');
      }
    } catch (e) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Buy SofCoin</h1>

      <label className="block mb-2">User ID (dev)</label>
      <input className="w-full mb-4 p-2 border rounded" value={userId} onChange={e=>setUserId(e.target.value)} placeholder="Paste your user id" />

      <div className="mb-4">
        <label className="block mb-2">USD</label>
        <input type="number" step="0.01" min="0" className="w-full p-2 border rounded" value={usd} onChange={e=>setUsd(Number(e.target.value))} />
      </div>

      <div className="mb-4">
        <label className="block mb-2">SofCoin</label>
        <input type="number" step="1" min="0" className="w-full p-2 border rounded" value={sof} onChange={e=>setSof(Number(e.target.value))} />
        <div className="text-sm text-gray-500 mt-1">Conversion: $1 = {SOF_PER_USD} SofCoin</div>
      </div>

      <div className="flex gap-2 mb-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleBuy} disabled={loading}>{loading ? 'Processing...' : 'Buy with Card'}</button>
        <button className="px-4 py-2 border rounded" onClick={fetchBalance}>Refresh Balance</button>
      </div>

      {message && <div className="mb-4 text-sm text-red-600">{message}</div>}

      <div className="p-4 border rounded">
        <div className="mb-2">Wallet SofCoin balance:</div>
        <div className="text-xl font-mono">{sofBalance ?? '—'}</div>
      </div>
    </div>
  );
}
