"use client";
import React, { useEffect, useState } from 'react';

export default function AdminWithdrawalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState('PENDING');

  async function fetchList() {
    const res = await fetch(`/api/admin/withdrawals?status=${status}`);
    const data = await res.json();
    if (res.ok) setItems(data);
  }

  useEffect(() => { fetchList(); }, [status]);

  async function doAction(id: string, action: string) {
    const res = await fetch('/api/admin/withdrawals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, requestId: id, adminId: 'admin-1' }) });
    const data = await res.json();
    alert(data.message || data.error || 'done');
    fetchList();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Withdrawals</h1>
      <div className="mb-4">
        <select value={status} onChange={e=>setStatus(e.target.value)} className="p-2 border rounded">
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      <div className="space-y-3">
        {items.map(it => (
          <div key={it.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-medium">{it.user?.email || it.userId}</div>
              <div className="text-sm">{it.amountSof} SofCoin — {it.amountUsd} USD</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>doAction(it.id, 'approve')}>Approve</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={()=>doAction(it.id, 'reject')}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
