'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, saveStoredUser, StoredUser } from '@/lib/user';

const AVATAR_OPTIONS = [
  { id: 'gradient-blue', label: 'Blue Gradient', colors: 'from-blue-500 to-purple-500' },
  { id: 'gradient-green', label: 'Green Gradient', colors: 'from-green-500 to-emerald-500' },
  { id: 'gradient-pink', label: 'Pink Gradient', colors: 'from-pink-500 to-rose-500' },
  { id: 'gradient-orange', label: 'Orange Gradient', colors: 'from-orange-500 to-red-500' },
  { id: 'gradient-cyan', label: 'Cyan Gradient', colors: 'from-cyan-500 to-blue-500' },
  { id: 'gradient-purple', label: 'Purple Gradient', colors: 'from-purple-500 to-pink-500' },
  { id: 'gradient-yellow', label: 'Yellow Gradient', colors: 'from-yellow-500 to-orange-500' },
  { id: 'gradient-indigo', label: 'Indigo Gradient', colors: 'from-indigo-500 to-purple-500' },
];

const BANNER_OPTIONS = [
  { id: 'banner-cosmic', label: 'Cosmic', gradient: 'from-purple-900 via-blue-900 to-black' },
  { id: 'banner-fire', label: 'Fire', gradient: 'from-red-900 via-orange-600 to-yellow-700' },
  { id: 'banner-ocean', label: 'Ocean', gradient: 'from-blue-600 via-cyan-500 to-blue-400' },
  { id: 'banner-forest', label: 'Forest', gradient: 'from-green-800 via-emerald-600 to-teal-500' },
  { id: 'banner-sunset', label: 'Sunset', gradient: 'from-orange-500 via-pink-500 to-purple-500' },
  { id: 'banner-night', label: 'Night', gradient: 'from-slate-900 via-slate-800 to-black' },
  { id: 'banner-neon', label: 'Neon', gradient: 'from-pink-500 via-purple-500 to-cyan-500' },
  { id: 'banner-gold', label: 'Gold', gradient: 'from-yellow-600 via-amber-500 to-orange-600' },
];

export default function CustomizeProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState('gradient-blue');
  const [selectedBanner, setSelectedBanner] = useState('banner-cosmic');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth');
      return;
    }

    setUser(storedUser);
    setSelectedAvatar(storedUser.avatar || 'gradient-blue');
    setSelectedBanner(storedUser.banner || 'banner-cosmic');
    setBio(storedUser.bio || '');
  }, [router]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage('');

    try {
      const updatedUser: StoredUser = {
        ...user,
        avatar: selectedAvatar,
        banner: selectedBanner,
        bio: bio.slice(0, 150), // Max 150 chars
      };

      saveStoredUser(updatedUser);
      setSaveMessage('Profile updated successfully! 🎉');

      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (error) {
      setSaveMessage('Error saving profile. Please try again.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const getAvatarGradient = (avatarId: string) => {
    return AVATAR_OPTIONS.find(a => a.id === avatarId)?.colors || 'from-blue-500 to-purple-500';
  };

  const getBannerGradient = (bannerId: string) => {
    return BANNER_OPTIONS.find(b => b.id === bannerId)?.gradient || 'from-purple-900 via-blue-900 to-black';
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background text-white pb-20 md:pb-0">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 md:py-16">
        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-12 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent">Personalization</p>
            <h1 className="mt-2 sm:mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold">Customize Your Profile</h1>
            <p className="mt-1 sm:mt-2 max-w-2xl text-xs sm:text-sm md:text-base text-slate-300">
              Make your profile unique. Choose your avatar, banner, and write your bio.
            </p>
          </div>
          <Link href="/profile" className="rounded-full border border-white/10 bg-white/5 px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold text-white transition hover:border-accent min-h-[44px]">
            Back to profile
          </Link>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Preview */}
            <section className="rounded-[32px] border border-white/10 bg-surface/80 p-4 sm:p-6 md:p-8 shadow-glow backdrop-blur-xl">
              <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent mb-4 sm:mb-6">Profile Preview</p>
              
              {/* Banner Preview */}
              <div className={`h-24 sm:h-32 w-full rounded-2xl bg-gradient-to-r ${getBannerGradient(selectedBanner)} mb-4 sm:mb-6`} />

              {/* Avatar & Info Preview */}
              <div className="flex items-end gap-3 sm:gap-4 pb-4 sm:pb-6">
                <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br ${getAvatarGradient(selectedAvatar)} border-4 border-white/20 -mt-8 sm:-mt-10 flex items-center justify-center text-lg sm:text-2xl font-bold`}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white">{user.username}</h2>
                  <p className="text-xs sm:text-sm text-slate-300">{user.name}</p>
                </div>
              </div>

              {/* Bio Preview */}
              <div className="rounded-xl bg-black/30 p-3 sm:p-4 border border-white/10">
                <p className="text-xs sm:text-sm text-slate-300">{bio || '(Your bio will appear here)'}</p>
              </div>
            </section>

            {/* Avatar Selection */}
            <section className="rounded-[32px] border border-white/10 bg-surface/80 p-4 sm:p-6 md:p-8 shadow-glow backdrop-blur-xl">
              <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent mb-4 sm:mb-6">Choose Avatar</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`rounded-2xl p-3 sm:p-4 border-2 transition min-h-[80px] sm:min-h-[100px] ${
                      selectedAvatar === avatar.id
                        ? 'border-accent bg-accent/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br ${avatar.colors} mx-auto mb-2 flex items-center justify-center text-sm sm:text-base font-bold text-white`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs text-slate-300 text-center">{avatar.label}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Banner Selection */}
            <section className="rounded-[32px] border border-white/10 bg-surface/80 p-4 sm:p-6 md:p-8 shadow-glow backdrop-blur-xl">
              <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent mb-4 sm:mb-6">Choose Banner</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {BANNER_OPTIONS.map((banner) => (
                  <button
                    key={banner.id}
                    onClick={() => setSelectedBanner(banner.id)}
                    className={`rounded-2xl p-3 sm:p-4 border-2 transition min-h-[80px] sm:min-h-[100px] ${
                      selectedBanner === banner.id
                        ? 'border-accent bg-accent/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`h-10 w-full sm:h-12 rounded-lg bg-gradient-to-r ${banner.gradient} mb-2`} />
                    <p className="text-xs text-slate-300 text-center">{banner.label}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Bio */}
            <section className="rounded-[32px] border border-white/10 bg-surface/80 p-4 sm:p-6 md:p-8 shadow-glow backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent mb-2 sm:mb-4">Your Bio</p>
                <p className="text-xs text-slate-400">Max 150 characters</p>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                placeholder="Tell us about yourself, your gaming style, or anything you'd like people to know..."
                className="w-full h-20 sm:h-24 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-accent resize-none text-sm sm:text-base min-h-[44px]"
              />
              <p className="mt-2 text-xs text-slate-400">{bio.length}/150</p>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 sm:space-y-6">
            {/* Save Button */}
            <div className="rounded-[32px] border border-white/10 bg-surface/80 p-4 sm:p-6 shadow-glow backdrop-blur-xl">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full rounded-full bg-accent px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-slate-950 transition hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-50 mb-4 min-h-[44px]"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              {saveMessage && (
                <p className={`text-xs text-center ${saveMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {saveMessage}
                </p>
              )}
            </div>

            {/* Info Cards */}
            <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-4 sm:p-6 shadow-glow">
              <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent mb-2 sm:mb-3">Tips</p>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-300">
                <p>✨ Choose colors that represent your gaming style</p>
                <p>🎨 Banners make your profile stand out</p>
                <p>💬 A good bio helps others know you better</p>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-4 sm:p-6 shadow-glow">
              <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-accent mb-3 sm:mb-4">Your Stats</p>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Level</span>
                  <span className="font-bold text-white">{user.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Wins</span>
                  <span className="font-bold text-white">{user.totalWins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">XP</span>
                  <span className="font-bold text-white">{user.xp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Friends</span>
                  <span className="font-bold text-white">{user.friends.length}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
