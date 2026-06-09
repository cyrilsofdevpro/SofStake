'use client';

import { useEffect, useState, useRef } from 'react';

interface ActivityEvent {
  id: string;
  type: 'win' | 'loss' | 'game_start' | 'deposit' | 'withdraw' | 'login' | 'level_up';
  userId: string;
  username: string;
  avatar: string;
  message: string;
  amount?: number;
  gameType?: 'dice' | 'wheel';
  timestamp: string;
}

interface LiveActivityFeedProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveActivityFeed({ isOpen, onClose }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const activitiesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load existing activities
    loadActivities();

    // Listen for new activities
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sofstake-activities') {
        loadActivities();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Auto-scroll to bottom when new activities arrive
    scrollToBottom();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activities]);

  const loadActivities = () => {
    const raw = localStorage.getItem('sofstake-activities');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setActivities(parsed.slice(-30)); // Keep last 30 activities
      } catch (error) {
        console.error('Failed to load activities:', error);
      }
    }
  };

  const scrollToBottom = () => {
    activitiesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'win': return '🏆';
      case 'loss': return '😢';
      case 'game_start': return '🎮';
      case 'deposit': return '💳';
      case 'withdraw': return '💰';
      case 'login': return '👋';
      case 'level_up': return '⬆️';
      default: return '📢';
    }
  };

  const getActivityColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'win': return 'text-yellow-400';
      case 'loss': return 'text-red-400';
      case 'game_start': return 'text-blue-400';
      case 'deposit': return 'text-green-400';
      case 'withdraw': return 'text-red-400';
      case 'login': return 'text-purple-400';
      case 'level_up': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-start p-4 pointer-events-none">
      <div className="w-full max-w-sm bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl pointer-events-auto max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse">
              📈
            </div>
            <div>
              <h3 className="font-semibold text-white">Live Activity</h3>
              <p className="text-xs text-slate-400">{activities.length} events</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Activities */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📈</div>
              <p className="text-slate-400 text-sm">No activity yet</p>
              <p className="text-slate-500 text-xs mt-1">Activity will appear here!</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 p-3 rounded-2xl bg-black/20 hover:bg-black/30 transition">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-${activity.avatar.split('-')[0] || 'blue'}-500 to-${activity.avatar.split('-')[1] || 'purple'}-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {activity.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm truncate">{activity.username}</span>
                    <span className={`text-lg ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm break-words">{activity.message}</p>
                  {activity.amount && (
                    <p className={`text-sm font-semibold mt-1 ${activity.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {activity.amount > 0 ? '+' : ''}₦{Math.abs(activity.amount).toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{formatTime(activity.timestamp)}</p>
                </div>
              </div>
            ))
          )}
          <div ref={activitiesEndRef} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live updates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility function to broadcast activity events
export function broadcastActivity(activity: Omit<ActivityEvent, 'id' | 'timestamp'>) {
  const newActivity: ActivityEvent = {
    ...activity,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };

  const raw = localStorage.getItem('sofstake-activities');
  let activities: ActivityEvent[] = [];
  if (raw) {
    try {
      activities = JSON.parse(raw);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }

  activities.push(newActivity);
  // Keep only last 100 activities
  if (activities.length > 100) {
    activities = activities.slice(-100);
  }

  localStorage.setItem('sofstake-activities', JSON.stringify(activities));

  // Trigger storage event for other tabs
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'sofstake-activities',
    newValue: JSON.stringify(activities)
  }));
}