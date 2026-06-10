'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addTransaction, getStoredUser, getTransactionHistory, StoredUser, Transaction } from '@/lib/user';

async function loadPaystackScript() {
  if (typeof window === 'undefined') return null;
  if ((window as any).PaystackPop) {
    return (window as any).PaystackPop;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      resolve((window as any).PaystackPop);
    };
    script.onerror = () => reject(new Error('Paystack script failed to load'));
    document.body.appendChild(script);
  });
}

const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

export default function WalletPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [sofBalance, setSofBalance] = useState(0);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [depositAmount, setDepositAmount] = useState(500);
  const [withdrawAmount, setWithdrawAmount] = useState(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ reference: string; amount: number; status: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const router = useRouter();

  const formatTransactionMeta = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return { label: 'Deposit', color: 'bg-emerald-500/10 text-emerald-300', icon: '💳' };
      case 'withdraw':
        return { label: 'Withdraw', color: 'bg-red-500/10 text-red-300', icon: '🏧' };
      case 'win':
        return { label: 'Win', color: 'bg-green-500/10 text-green-300', icon: '🎉' };
      case 'loss':
        return { label: 'Loss', color: 'bg-rose-500/10 text-rose-300', icon: '📉' };
      case 'bonus':
      case 'daily_bonus':
      case 'streak_bonus':
      case 'referral_bonus':
        return { label: 'Bonus', color: 'bg-sky-500/10 text-sky-300', icon: '✨' };
      case 'fee':
        return { label: 'Fee', color: 'bg-orange-500/10 text-orange-300', icon: '⚡' };
      default:
        return { label: 'Activity', color: 'bg-white/5 text-slate-300', icon: 'ℹ️' };
    }
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    const fallbackBalance = (storedUser && storedUser.walletBalance > 0)
      ? storedUser.walletBalance
      : (storedUser?.transactions?.[0]?.balance ?? 0);
    setWalletBalance(fallbackBalance || 0);
    setTransactions(getTransactionHistory(10));

    // Fetch sofBalance from API
    const fetchSofBalance = async () => {
      try {
        const res = await fetch('/api/wallet');
        const data = await res.json();
        setSofBalance(Number(data.sofBalance) || 0);
      } catch (error) {
        console.error('Failed to fetch SOF balance:', error);
        setSofBalance(storedUser?.sofBalance || 0);
      }
    };
    fetchSofBalance();
  }, []);

  const handleDeposit = async (amount: number) => {
    if (!user) return;
    if (!paystackPublicKey) {
      setStatusMessage('Missing Paystack public key. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to .env.local and restart the app.');
      return;
    }
    setIsProcessing(true);
    setStatusMessage('Initializing Paystack checkout...');

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, email: user.email, userId: user.id })
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new Error(data.message || data.error || 'Paystack initialization failed');
      }

      const authorizationUrl = data.data?.authorization_url || null;
      setAuthorizationUrl(authorizationUrl);

      const paystack = await loadPaystackScript();
      const canOpenInline = paystack && typeof paystack.setup === 'function';

      if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
        throw new Error('Missing Paystack public key');
      }

      async function verifyPayment(reference: string) {
        setStatusMessage('Verifying payment...');
        const verifyResponse = await fetch(`/api/payments?reference=${encodeURIComponent(reference)}`);
        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok || !verifyData.data || verifyData.data.status !== 'success') {
          setStatusMessage('Payment verification failed. Please contact support.');
          setIsProcessing(false);
          return;
        }

        const updatedUser = addTransaction('deposit', amount, `Paystack deposit (${reference})`, 'completed');
        if (updatedUser) {
          setUser(updatedUser);
          const newBalance = (updatedUser.walletBalance && updatedUser.walletBalance > 0)
            ? updatedUser.walletBalance
            : (updatedUser.transactions?.[0]?.balance ?? 0);
          setWalletBalance(newBalance || 0);
          setTransactions(getTransactionHistory(10));
          setConfirmation({ reference, amount, status: 'completed' });
          setStatusMessage('Deposit successful! Funds are now available.');
        } else {
          setStatusMessage('Deposit succeeded but user session could not be updated.');
        }
        setIsProcessing(false);
      }

      const onClose = function () {
        setIsProcessing(false);
        setStatusMessage('Payment window closed. No funds were added.');
      };

      const callback = function (callbackResponse: any) {
        const reference = callbackResponse?.reference || callbackResponse?.data?.reference;
        if (!callbackResponse || !reference) {
          setStatusMessage('Invalid Paystack callback response.');
          setIsProcessing(false);
          return;
        }

        void verifyPayment(reference);
      };

      let openedInline = false;
      if (canOpenInline && paystack) {
        const handler = paystack.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: amount * 100,
          currency: 'NGN',
          ref: data.data.reference,
          metadata: {
            userId: user.id,
            email: user.email
          },
          onClose,
          callback
        });

        try {
          handler.openIframe();
          openedInline = true;
        } catch (inlineError) {
          console.warn('Paystack inline checkout failed', inlineError);
        }
      }

      if (!openedInline) {
        if (authorizationUrl) {
          setStatusMessage('Redirecting to Paystack checkout...');
          window.location.href = authorizationUrl;
          return;
        }
        throw new Error('Could not open Paystack checkout. Please refresh and try again.');
      }
    } catch (error: any) {
      setStatusMessage(error?.message || 'Unable to start Paystack deposit.');
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async (amount: number) => {
    if (!user) {
      setStatusMessage('Please log in to withdraw funds.');
      return;
    }

    if (amount > walletBalance) {
      setStatusMessage('Insufficient balance to withdraw.');
      return;
    }

    if (amount < 100) {
      setStatusMessage('Minimum withdrawal is ₦100.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Processing withdrawal...');

    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount,
          method: 'bank_transfer'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Withdrawal request failed');
      }

      // Add withdrawal transaction to history
      const updatedUser = addTransaction('withdraw', -amount, `Bank withdrawal (${data.reference})`, 'pending');
      if (updatedUser) {
        setUser(updatedUser);
        const newBalance = (updatedUser.walletBalance && updatedUser.walletBalance > 0)
          ? updatedUser.walletBalance
          : (updatedUser.transactions?.[0]?.balance ?? 0);
        setWalletBalance(newBalance || 0);
        setTransactions(getTransactionHistory(10));
        setStatusMessage('✓ Withdrawal request submitted. Processing within 24-48 hours.');
        setWithdrawAmount(1000);
        setActiveTab('deposit');
      }
    } catch (error: any) {
      setStatusMessage(error?.message || 'Failed to process withdrawal request');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-[32px] border border-white/10 bg-surface/80 p-10 shadow-glow backdrop-blur-xl">
          {!user ? (
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-accent">Wallet</p>
              <h1 className="mt-4 text-4xl font-semibold">Manage funds</h1>
              <p className="mt-4 text-slate-300">Please log in to access your wallet.</p>
              <button onClick={() => router.push('/auth')} className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent2">Log in</button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-accent">Wallet</p>
                  <h1 className="text-4xl font-semibold">Manage funds</h1>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                  <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200">
                    <span className="text-slate-400">SOF Balance:</span> {sofBalance.toLocaleString()}
                  </div>
                  <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200">
                    <span className="text-slate-400">Wallet:</span> ₦{walletBalance.toLocaleString()}
                  </div>
                </div>
              </div>
              {!paystackPublicKey ? (
                <div className="mt-6 rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  Paystack public key is missing. Add `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` to your `.env.local` and restart the app.
                </div>
              ) : null}
              <div className="mt-10 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                  <div className="flex gap-2 border-b border-white/10">
                    <button
                      onClick={() => setActiveTab('deposit')}
                      className={`pb-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                        activeTab === 'deposit'
                          ? 'border-b-2 border-accent text-accent'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => setActiveTab('withdraw')}
                      className={`pb-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                        activeTab === 'withdraw'
                          ? 'border-b-2 border-accent text-accent'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Withdraw
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    {activeTab === 'deposit' ? (
                      <>
                        <div className="rounded-3xl bg-white/5 p-4">
                          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Wallet Balance</p>
                          <p className="mt-2 text-3xl font-semibold text-white">₦{walletBalance.toLocaleString()}</p>
                        </div>
                        <label className="grid gap-2">
                          <span className="text-sm uppercase tracking-[0.25em] text-slate-400">Deposit amount</span>
                          <input
                            type="number"
                            min={100}
                            step={100}
                            value={depositAmount}
                            onChange={(event) => setDepositAmount(Number(event.target.value))}
                            className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent"
                            placeholder="Enter amount"
                          />
                        </label>
                        <button
                          disabled={isProcessing || !paystackPublicKey}
                          onClick={() => handleDeposit(depositAmount)}
                          className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? 'Processing...' : `Deposit ₦${depositAmount.toLocaleString()}`}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="rounded-3xl bg-white/5 p-4">
                          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Available to Withdraw</p>
                          <p className="mt-2 text-3xl font-semibold text-white">₦{walletBalance.toLocaleString()}</p>
                          <p className="mt-2 text-xs text-slate-400">Minimum: ₦100 • Processing: 24-48 hours</p>
                        </div>
                        <label className="grid gap-2">
                          <span className="text-sm uppercase tracking-[0.25em] text-slate-400">Withdrawal amount</span>
                          <input
                            type="number"
                            min={100}
                            step={100}
                            max={walletBalance}
                            value={withdrawAmount}
                            onChange={(event) => setWithdrawAmount(Number(event.target.value))}
                            className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent"
                            placeholder="Enter amount"
                          />
                        </label>
                        <button
                          disabled={isProcessing || withdrawAmount > walletBalance || withdrawAmount < 100}
                          onClick={() => handleWithdraw(withdrawAmount)}
                          className="w-full rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? 'Processing...' : `Request Withdrawal ₦${withdrawAmount.toLocaleString()}`}
                        </button>
                      </>
                    )}

                    {statusMessage ? (
                      <p className="rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-200">{statusMessage}</p>
                    ) : null}
                  </div>
                </section>

                <aside className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Recent activity</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Last 10 transactions</span>
                  </div>
                  <div className="mt-5 space-y-4">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => {
                        const meta = formatTransactionMeta(transaction.type);
                        return (
                          <div key={transaction.id} className="rounded-3xl bg-black/30 p-4 text-sm text-slate-200">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${meta.color}`}>
                                  {meta.icon}
                                </span>
                                <div>
                                  <p className="font-semibold text-white">{transaction.description}</p>
                                  <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">{meta.label}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 text-right">
                                <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
                                  {transaction.status || 'completed'}
                                </span>
                                <span className="font-semibold text-white">₦{transaction.amount.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-slate-400">
                              {new Date(transaction.timestamp).toLocaleString()} • Balance ₦{transaction.balance.toLocaleString()}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      ['No activity yet', 'Your wallet starts at ₦0', 'Deposit to start playing'].map((item) => (
                        <div key={item} className="rounded-3xl bg-black/30 p-4 text-sm text-slate-200">
                          {item}
                        </div>
                      ))
                    )}
                  </div>
                </aside>
              </div>

              {confirmation ? (
                <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  <p className="font-semibold">Payment confirmed</p>
                  <p>Reference: {confirmation.reference}</p>
                  <p>Amount: ₦{confirmation.amount.toLocaleString()}</p>
                  <p>Status: {confirmation.status}</p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
