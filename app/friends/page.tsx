'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, StoredUser, getAllUsers, addFriend, removeFriend, getFriends } from '@/lib/user';

export default function FriendsPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [friends, setFriends] = useState<StoredUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth');
      return;
    }

    setUser(storedUser);
    setAllUsers(getAllUsers());
    setFriends(getFriends());
  }, [router]);

  const handleAddFriend = (friendId: string) => {
    if (!user) return;
    addFriend(friendId);
    setUser({ ...user, friends: [...user.friends, friendId] });
    setFriends(getFriends());
  };

  const handleRemoveFriend = (friendId: string) => {
    if (!user) return;
    removeFriend(friendId);
    setUser({ ...user, friends: user.friends.filter(id => id !== friendId) });
    setFriends(getFriends());
  };

  const filteredUsers = allUsers.filter(u =>
    u.id !== user?.id &&
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !user?.friends.includes(u.id)
  );

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background text-white pb-20 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 md:py-16">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent">Social</p>
            <h1 className="mt-2 sm:mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold">Friends</h1>
            <p className="mt-1 sm:mt-2 max-w-2xl text-xs sm:text-sm md:text-base text-slate-300">
              Connect with other players, invite them to matches, and share your achievements.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-[32px] border border-white/10 bg-surface/80 p-4 sm:p-6 md:p-8 shadow-glow backdrop-blur-xl">
            <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl md:text-2xl font-semibold">Your Friends ({friends.length})</h2>
            {friends.length === 0 ? (
              <p className="text-xs sm:text-sm md:text-base text-slate-400">No friends yet. Add some players below!</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/80 p-3 sm:p-4 md:p-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs sm:text-sm text-white font-bold">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-white">{friend.username}</p>
                        <p className="text-xs sm:text-sm text-slate-400">Level {friend.level} • {friend.totalWins} wins</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button className="rounded-full bg-accent px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-accent2 min-h-[36px] sm:min-h-[40px]">
                        Invite to Match
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="rounded-full border border-red-500 bg-red-500/10 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-red-300 transition hover:bg-red-500/20 min-h-[36px] sm:min-h-[40px]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[32px] border border-white/10 bg-surface/80 p-4 sm:p-6 md:p-8 shadow-glow backdrop-blur-xl">
            <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl md:text-2xl font-semibold">Find Players</h2>
            <div className="mb-4 sm:mb-6">
              <input
                type="text"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-accent text-sm sm:text-base min-h-[44px]"
              />
            </div>
            <div className="space-y-3 sm:space-y-4">
              {filteredUsers.slice(0, 10).map((potentialFriend) => (
                <div key={potentialFriend.id} className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/80 p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 text-xs sm:text-sm text-white font-bold">
                      {potentialFriend.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-white">{potentialFriend.username}</p>
                      <p className="text-xs sm:text-sm text-slate-400">Level {potentialFriend.level} • {potentialFriend.totalWins} wins</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFriend(potentialFriend.id)}
                    className="rounded-full bg-accent px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-accent2 min-h-[36px] sm:min-h-[40px]"
                  >
                    Add Friend
                  </button>
                </div>
              ))}
              {filteredUsers.length === 0 && searchTerm && (
                <p className="text-xs sm:text-sm md:text-base text-slate-400">No players found matching "{searchTerm}"</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}