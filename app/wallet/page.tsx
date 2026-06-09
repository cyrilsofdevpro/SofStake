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
  const [user, setUser] = useState<StoredUser | null>(null);
  const [depositAmount, setDepositAmount] = useState(500);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmation, setConfirmation] = useState<{ reference: string; amount: number; status: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    const fallbackBalance = (storedUser && storedUser.walletBalance > 0)
      ? storedUser.walletBalance
      : (storedUser?.transactions?.[0]?.balance ?? 0);
    setWalletBalance(fallbackBalance || 0);
    setTransactions(getTransactionHistory(10));
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

      const paystack = await loadPaystackScript();
      if (!paystack || typeof paystack.setup !== 'function') {
        throw new Error('Could not load Paystack checkout. Please refresh and try again.');
      }

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

      handler.openIframe();
    } catch (error: any) {
      setStatusMessage(error?.message || 'Unable to start Paystack deposit.');
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
                <div className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200">Minimum deposit ₦100</div>
              </div>
              {!paystackPublicKey ? (
                <div className="mt-6 rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  Paystack public key is missing. Add `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` to your `.env.local` and restart the app.
                </div>
              ) : null}
              <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                  <div className="space-y-4">
                    <div className="rounded-3xl bg-white/5 p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Current balance</p>
                      <p className="mt-2 text-3xl font-semibold text-white">₦{walletBalance.toLocaleString()}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <label className="grid gap-2">
                        <span className="text-sm uppercase tracking-[0.25em] text-slate-400">Deposit amount</span>
                        <input
                          type="number"
                          min={100}
                          step={100}
                          value={depositAmount}
                          onChange={(event) => setDepositAmount(Number(event.target.value))}
                          className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent"
                        />
                      </label>
                      <button
                        disabled={isProcessing || !paystackPublicKey}
                        onClick={() => handleDeposit(depositAmount)}
                        className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isProcessing ? 'Processing...' : `Deposit ₦${depositAmount.toLocaleString()}`}
                      </button>
                    </div>
                    {statusMessage ? (
                      <p className="rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-200">{statusMessage}</p>
                    ) : null}
                  </div>
                </section>
                <aside className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Recent activity</p>
                  <div className="mt-5 space-y-4">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <div key={transaction.id} className="rounded-3xl bg-black/30 p-4 text-sm text-slate-200">
                          <div className="flex items-center justify-between gap-4">
                            <span>{transaction.description}</span>
                            <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
                              {transaction.status || 'completed'}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-slate-400">
                            {new Date(transaction.timestamp).toLocaleString()} • Balance ₦{transaction.balance.toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      ['No activity yet', 'Your wallet starts at ₦0', 'Deposit to start playing'].map((item) => (
                        <div key={item} className="rounded-3xl bg-black/30 p-4 text-sm text-slate-200">
                          {item}
                        </div>
                      ))
                    )}
                  </div>
                </aside>
                {confirmation ? (
                  <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                    <p className="font-semibold">Payment confirmed</p>
                    <p>Reference: {confirmation.reference}</p>
                    <p>Amount: ₦{confirmation.amount.toLocaleString()}</p>
                    <p>Status: {confirmation.status}</p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
