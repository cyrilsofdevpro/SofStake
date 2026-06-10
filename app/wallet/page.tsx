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
const SOF_TO_USD = 200; // 200 SOF = 1 USD
const USD_TO_NAIRA_RATE = 1500; // Approximate rate, will be updated with real-time feed

export default function WalletPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [sofBalance, setSofBalance] = useState(0);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [depositAmount, setDepositAmount] = useState(500);
  const [withdrawAmount, setWithdrawAmount] = useState(1000);
  const [sellSofAmount, setSellSofAmount] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'sell'>('deposit');
  const [usdToNairaRate, setUsdToNairaRate] = useState(USD_TO_NAIRA_RATE);
  const [priceLoading, setPriceLoading] = useState(false);
  const router = useRouter();

  // Fetch real-time USD to Naira rate
  useEffect(() => {
    const fetchExchangeRate = async () => {
      setPriceLoading(true);
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        const ngn = data.rates?.NGN || USD_TO_NAIRA_RATE;
        setUsdToNairaRate(ngn);
      } catch (error) {
        console.warn('Failed to fetch exchange rate, using default:', error);
        setUsdToNairaRate(USD_TO_NAIRA_RATE);
      } finally {
        setPriceLoading(false);
      }
    };
    
    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const calculateSofToNaira = (sofAmount: number) => {
    return Math.floor((sofAmount / SOF_TO_USD) * usdToNairaRate);
  };

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

    const fetchBalances = async (currentUser?: StoredUser | null) => {
      if (!currentUser) return;
      try {
        const res = await fetch(`/api/wallet?userId=${encodeURIComponent(currentUser.id)}`);
        const data = await res.json();
        if (res.ok) {
          if (typeof data.sofBalance === 'number') {
            setSofBalance(data.sofBalance);
          }
          if (typeof data.usdBalance === 'number' && data.usdBalance > 0) {
            setWalletBalance(data.usdBalance);
          }
        }
      } catch (error) {
        console.error('Failed to fetch balances:', error);
      }
    };

    const verifyPaymentReference = async (reference: string) => {
      setIsProcessing(true);
      setStatusMessage('Verifying Paystack payment...');
      try {
        const verifyResponse = await fetch(`/api/payments?reference=${encodeURIComponent(reference)}`);
        const data = await verifyResponse.json();

        if (!verifyResponse.ok || !data.data || data.data.status !== 'success') {
          setStatusMessage('Unable to verify Paystack payment. Please contact support.');
          return;
        }

        const amount = typeof data.data.amount === 'number' ? Number(data.data.amount) / 100 : 0;
        if (!amount) {
          setStatusMessage('Verified payment amount is invalid.');
          return;
        }

        setWalletBalance((prev) => prev + amount);
        const updatedUser = addTransaction('deposit', amount, `Paystack deposit (${reference})`, 'completed');
        if (updatedUser) {
          setUser(updatedUser);
          setTransactions(getTransactionHistory(10));
        }
        setStatusMessage(`✓ Deposit confirmed: ₦${amount.toLocaleString()}`);
      } catch (error) {
        console.error('Payment verification failed', error);
        setStatusMessage('Payment verification failed. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    fetchBalances(storedUser);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const reference = url.searchParams.get('reference');
      if (reference) {
        void verifyPaymentReference(reference).finally(() => {
          url.searchParams.delete('reference');
          window.history.replaceState({}, '', url.pathname);
        });
      }
    }
  }, []);

  const handleSellSof = async (sofAmount: number) => {
    if (!user) {
      setStatusMessage('Please log in to sell SOF.');
      return;
    }

    if (sofAmount > sofBalance) {
      setStatusMessage('Insufficient SOF balance to sell.');
      return;
    }

    if (sofAmount < 2) {
      setStatusMessage('Minimum sell amount is 2 SOF.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Processing SOF sale...');

    try {
      const nairaAmount = calculateSofToNaira(sofAmount);
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'sell_sof',
          sofAmount,
          nairaAmount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'SOF sale failed');
      }

      // Update balance and add transaction
      setSofBalance(sofBalance - sofAmount);
      setWalletBalance(walletBalance + nairaAmount);
      const updatedUser = addTransaction('deposit', nairaAmount, `SOF sale: ${sofAmount} SOF → ₦${nairaAmount.toLocaleString()}`, 'completed');
      if (updatedUser) {
        setUser(updatedUser);
        setTransactions(getTransactionHistory(10));
      }
      setStatusMessage(`✓ Sold ${sofAmount} SOF for ₦${nairaAmount.toLocaleString()}`);
      setSellSofAmount(10);
    } catch (error: any) {
      setStatusMessage(error?.message || 'Failed to sell SOF');
    } finally {
      setIsProcessing(false);
    }
  };

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

        setWalletBalance((prev) => prev + amount);
        const updatedUser = addTransaction('deposit', amount, `Paystack deposit (${reference})`, 'completed');
        if (updatedUser) {
          setUser(updatedUser);
          setTransactions(getTransactionHistory(10));
          setStatusMessage('✓ Deposit successful! Funds are now available.');
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
        const authorizationUrl = data.data?.authorization_url || null;
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

      setWalletBalance(walletBalance - amount);
      const updatedUser = addTransaction('withdraw', -amount, `Bank withdrawal (${data.reference})`, 'pending');
      if (updatedUser) {
        setUser(updatedUser);
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-surface/80 p-6 sm:p-10 shadow-glow backdrop-blur-xl">
          {!user ? (
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-accent">Wallet</p>
              <h1 className="mt-4 text-3xl sm:text-4xl font-semibold">Manage funds</h1>
              <p className="mt-4 text-slate-300 text-sm sm:text-base">Please log in to access your wallet.</p>
              <button onClick={() => router.push('/auth')} className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent2">Log in</button>
            </div>
          ) : (
            <>
              {/* Header with balances - Mobile responsive grid */}
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-4 border border-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wallet Balance</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">₦{walletBalance.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-4 border border-cyan-500/20">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">SOF Balance</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-bold text-cyan-100">{sofBalance.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 border border-green-500/20">
                  <p className="text-xs uppercase tracking-[0.2em] text-green-300">Available to Spend</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-bold text-green-100">₦{walletBalance.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-green-300/70">Ready to use now</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 border border-purple-500/20">
                  <p className="text-xs uppercase tracking-[0.2em] text-purple-300">SOF Value</p>
                  <p className="mt-2 text-2xl sm:text-3xl font-bold text-purple-100">₦{calculateSofToNaira(sofBalance).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-purple-300/70">{priceLoading ? 'Updating...' : '1 USD = ₦' + usdToNairaRate.toFixed(2)}</p>
                </div>
              </div>

              {!paystackPublicKey ? (
                <div className="mb-6 rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  Paystack public key is missing. Add `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` to your `.env.local` and restart the app.
                </div>
              ) : null}

              {/* Main content grid - Mobile responsive */}
              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                {/* Main action column */}
                <div className="lg:col-span-2">
                  <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                    {/* Tab buttons - Mobile optimized */}
                    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
                      {['deposit', 'withdraw', 'sell'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] rounded-full transition ${
                            activeTab === tab
                              ? 'bg-accent text-slate-950'
                              : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {tab === 'sell' ? 'Sell SOF' : tab === 'deposit' ? 'Deposit' : 'Withdraw'}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="mt-6 space-y-4">
                      {activeTab === 'deposit' && (
                        <>
                          <div className="rounded-3xl bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wallet Balance</p>
                            <p className="mt-2 text-2xl sm:text-3xl font-semibold text-white">₦{walletBalance.toLocaleString()}</p>
                          </div>
                          <label className="grid gap-2">
                            <span className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">Deposit amount (NGN)</span>
                            <input
                              type="number"
                              min={100}
                              step={100}
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(Number(e.target.value))}
                              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent text-sm"
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
                      )}

                      {activeTab === 'withdraw' && (
                        <>
                          <div className="rounded-3xl bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Available to Withdraw</p>
                            <p className="mt-2 text-2xl sm:text-3xl font-semibold text-white">₦{walletBalance.toLocaleString()}</p>
                            <p className="mt-2 text-xs text-slate-400">Min: ₦100 • Processing: 24-48 hours</p>
                          </div>
                          <label className="grid gap-2">
                            <span className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">Withdrawal amount (NGN)</span>
                            <input
                              type="number"
                              min={100}
                              step={100}
                              max={walletBalance}
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent text-sm"
                              placeholder="Enter amount"
                            />
                          </label>
                          <button
                            disabled={isProcessing || withdrawAmount > walletBalance || withdrawAmount < 100}
                            onClick={() => handleWithdraw(withdrawAmount)}
                            className="w-full rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing ? 'Processing...' : `Request ₦${withdrawAmount.toLocaleString()}`}
                          </button>
                        </>
                      )}

                      {activeTab === 'sell' && (
                        <>
                          <div className="rounded-3xl bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">SOF Balance</p>
                            <p className="mt-2 text-2xl sm:text-3xl font-semibold text-white">{sofBalance.toLocaleString()} SOF</p>
                            <p className="mt-2 text-xs text-slate-400">Value: ₦{calculateSofToNaira(sofBalance).toLocaleString()}</p>
                          </div>
                          <label className="grid gap-2">
                            <span className="text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">SOF Amount to Sell</span>
                            <input
                              type="number"
                              min={2}
                              step={1}
                              max={sofBalance}
                              value={sellSofAmount}
                              onChange={(e) => setSellSofAmount(Number(e.target.value))}
                              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-accent text-sm"
                              placeholder="Enter SOF amount"
                            />
                            <p className="text-xs text-slate-400">
                              You will receive: ₦{calculateSofToNaira(sellSofAmount).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-400">
                              200 SOF = $1, 2 SOF = $0.01, converted at live USD/NGN rate.
                            </p>
                          </label>
                          <button
                            disabled={isProcessing || sellSofAmount > sofBalance || sellSofAmount < 2}
                            onClick={() => handleSellSof(sellSofAmount)}
                            className="w-full rounded-full bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing ? 'Processing...' : `Sell ${sellSofAmount} SOF for ₦${calculateSofToNaira(sellSofAmount).toLocaleString()}`}
                          </button>
                        </>
                      )}

                      {statusMessage ? (
                        <p className="rounded-2xl bg-white/5 px-4 py-3 text-xs sm:text-sm text-slate-200">{statusMessage}</p>
                      ) : null}
                    </div>
                  </section>
                </div>

                {/* Transactions sidebar - Mobile responsive */}
                <aside className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent Activity</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Last 10</span>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => {
                        const meta = formatTransactionMeta(transaction.type);
                        return (
                          <div key={transaction.id} className="rounded-2xl bg-black/30 p-3 text-xs sm:text-sm">
                            <div className="flex items-start gap-2">
                              <span className={`mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-lg ${meta.color}`}>
                                {meta.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">{transaction.description}</p>
                                <p className="text-xs text-slate-400 uppercase tracking-[0.15em]">{meta.label}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(transaction.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="block font-semibold text-white text-sm">
                                  {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                                </span>
                                <span className={`text-xs uppercase tracking-[0.15em] inline-block rounded px-2 py-1 mt-1 ${
                                  transaction.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                                }`}>
                                  {transaction.status || 'completed'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-center text-slate-400 text-xs py-8">No transactions yet</p>
                    )}
                  </div>
                </aside>
              </div>

              {/* Exchange rate info - Mobile responsive */}
              <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/50 p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Exchange Rates</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-slate-400 text-xs uppercase">SOF Rate</p>
                    <p className="text-white font-semibold mt-1">200 SOF = $1</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-slate-400 text-xs uppercase">USD to NGN</p>
                    <p className="text-white font-semibold mt-1">1 USD = ₦{usdToNairaRate.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-slate-400 text-xs uppercase">2 SOF Value</p>
                    <p className="text-white font-semibold mt-1">≈ ₦{calculateSofToNaira(2).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-slate-400 text-xs uppercase">Rate Status</p>
                    <p className={`font-semibold mt-1 ${priceLoading ? 'text-yellow-400' : 'text-green-400'}`}>
                      {priceLoading ? 'Updating' : 'Live'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
