'use client';

import { useEffect, useState, useRef } from 'react';
import { getStoredUser, StoredUser } from '@/lib/user';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: string;
  reactions: { [emoji: string]: string[] }; // emoji -> array of userIds
}

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function LiveChat({ isOpen, onClose }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<StoredUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);

    // Load existing messages
    loadMessages();

    // Listen for new messages
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sofstake-chat-messages') {
        loadMessages();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Auto-scroll to bottom when new messages arrive
    scrollToBottom();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = () => {
    const raw = localStorage.getItem('sofstake-chat-messages');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setMessages(parsed.slice(-50)); // Keep last 50 messages
      } catch (error) {
        console.error('Failed to load chat messages:', error);
      }
    }
  };

  const saveMessages = (newMessages: ChatMessage[]) => {
    localStorage.setItem('sofstake-chat-messages', JSON.stringify(newMessages));
    // Trigger storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'sofstake-chat-messages',
      newValue: JSON.stringify(newMessages)
    }));
  };

  const sendMessage = () => {
    if (!user || !newMessage.trim()) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      avatar: user.avatar || 'blue-purple',
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      reactions: {}
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setNewMessage('');

    // Focus back to input
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!user) return;

    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        const reactions = { ...msg.reactions };
        if (!reactions[emoji]) {
          reactions[emoji] = [];
        }

        const userIndex = reactions[emoji].indexOf(user.id);
        if (userIndex >= 0) {
          // Remove reaction
          reactions[emoji].splice(userIndex, 1);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        } else {
          // Add reaction
          reactions[emoji].push(user.id);
        }

        return { ...msg, reactions };
      }
      return msg;
    });

    setMessages(updatedMessages);
    saveMessages(updatedMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end p-4 pointer-events-none">
      <div className="w-full max-w-sm bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl pointer-events-auto max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              💬
            </div>
            <div>
              <h3 className="font-semibold text-white">Global Chat</h3>
              <p className="text-xs text-slate-400">{messages.length} messages</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-slate-400 text-sm">No messages yet</p>
              <p className="text-slate-500 text-xs mt-1">Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="group">
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-${message.avatar.split('-')[0] || 'blue'}-500 to-${message.avatar.split('-')[1] || 'purple'}-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {message.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm truncate">{message.username}</span>
                      <span className="text-xs text-slate-500">{formatTime(message.timestamp)}</span>
                    </div>
                    <p className="text-slate-200 text-sm break-words">{message.message}</p>

                    {/* Reactions */}
                    {Object.keys(message.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(message.reactions).map(([emoji, userIds]) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(message.id, emoji)}
                            className={`px-2 py-1 rounded-full text-xs bg-white/10 hover:bg-white/20 transition flex items-center gap-1 ${
                              user && userIds.includes(user.id) ? 'bg-accent/20 text-accent' : 'text-slate-300'
                            }`}
                          >
                            {emoji} {userIds.length}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reaction buttons (show on hover) */}
                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {EMOJI_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(message.id, emoji)}
                      className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {user && (
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white placeholder-slate-400 text-sm outline-none focus:border-accent transition"
                maxLength={200}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="w-10 h-10 rounded-full bg-accent hover:bg-accent2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-slate-950 transition"
              >
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}