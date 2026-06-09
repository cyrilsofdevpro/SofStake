"use client";
import React, { useEffect, useState } from 'react';

export default function AdminAnalyticsPage() {
  const [events, setEvents] = useState<any[]>([]);

  async function fetchEvents() {
    const res = await fetch('/api/admin/analytics');
    const data = await res.json();
    if (res.ok) setEvents(data);
  }

  useEffect(()=>{ fetchEvents(); }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Analytics Events</h1>
      <div className="space-y-2">
        {events.map(e=> (
          <div key={e.id} className="p-3 border rounded">
            <div className="text-sm">{e.event} — {e.userId || 'anon'}</div>
            <div className="text-xs text-gray-600">{e.ip || ''} — {new Date(e.createdAt).toLocaleString()}</div>
            <div className="text-xs">{e.meta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
