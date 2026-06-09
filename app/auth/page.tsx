'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveStoredUser } from '@/lib/user';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user has auth token
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (response.ok) {
          // User is already authenticated - fetch and save user data
          const data = await response.json();
          if (data.user) {
            saveStoredUser({
              id: data.user.id,
              email: data.user.email,
              username: data.user.username,
              name: data.user.name,
              createdAt: data.user.createdAt || new Date().toISOString(),
              walletBalance: data.user.walletBalance || 0,
            });
          }
          // Redirect to dashboard
          router.push('/dashboard');
          return;
        }
      } catch (err) {
        // No auth, continue to login page
      }
      setSessionLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (mode === 'register' && (!username || !name)) {
      setError('Please enter a username and name.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login' 
        ? { email, password }
        : { email, password, username, name };

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `${mode === 'login' ? 'Login' : 'Registration'} failed`);
        setLoading(false);
        return;
      }

      // Save user data to sessionStorage
      if (data.user) {
        saveStoredUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          name: data.user.name,
          createdAt: data.user.createdAt || new Date().toISOString(),
          walletBalance: data.user.walletBalance || 0,
        });
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error(`${mode} error:`, err);
      setError(`An error occurred during ${mode}`);
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <main className="min-h-screen bg-background text-white flex items-center justify-center">
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-20">
        <div className="rounded-[32px] border border-white/10 bg-surface/80 p-10 shadow-glow backdrop-blur-xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-accent">Authentication</p>
              <h1 className="mt-3 text-4xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Join SofStake'}</h1>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-accent"
            >
              Switch to {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </div>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="space-y-2 text-sm text-slate-300">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-accent"
                  placeholder="Your full name"
                />
              </label>
            )}
            {mode === 'register' && (
              <label className="space-y-2 text-sm text-slate-300">
                <span>Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-accent"
                  placeholder="sofstaker"
                />
              </label>
            )}
            <label className="space-y-2 text-sm text-slate-300">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-accent"
                placeholder="hey@you.com"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-accent"
                placeholder="••••••••"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
