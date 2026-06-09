export const SESSION_STORAGE_USER_KEY = 'sofstake-session-user';
export const LOCAL_STORAGE_USERS_KEY = 'sofstake-users';

export type StoredUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  walletBalance: number;
  winStreak: number;
  totalWins: number;
  xp: number;
  level: number;
  lastLogin: string;
  badges: string[];
  friends: string[]; // Array of friend user IDs
  avatar: string; // Avatar color/style
  banner: string; // Banner image style
  bio: string; // User bio
  createdAt: string;
  transactions: Transaction[];
  // Referral system
  referralCode: string; // Unique referral code
  referredBy?: string; // User ID who referred this user
  referrals: string[]; // Array of user IDs they've referred
  referralEarnings: number; // Total earnings from referrals
  // Bonus system
  lastBonusClaim: string; // Last daily bonus claim date
  loginStreak: number; // Current login streak
  totalBonusEarnings: number; // Total bonus earnings
};

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdraw' | 'win' | 'loss' | 'bonus' | 'fee' | 'referral_bonus' | 'daily_bonus' | 'streak_bonus';
  amount: number;
  description: string;
  timestamp: string;
  balance: number; // Balance after transaction
  status?: 'pending' | 'completed' | 'failed';
};

type TransactionType = Transaction['type'];
type TransactionStatus = Transaction['status'];

function isTransactionType(value: any): value is TransactionType {
  return typeof value === 'string' && [
    'deposit',
    'withdraw',
    'win',
    'loss',
    'bonus',
    'fee',
    'referral_bonus',
    'daily_bonus',
    'streak_bonus'
  ].includes(value);
}

function isTransactionStatus(value: any): value is TransactionStatus {
  return value === 'pending' || value === 'completed' || value === 'failed';
}

function normalizeStoredUser(rawUser: Partial<StoredUser>): StoredUser {
  const txs: Transaction[] = Array.isArray(rawUser.transactions)
    ? rawUser.transactions.map((tx: Partial<Transaction>) => ({
        id: tx.id ?? crypto.randomUUID(),
        type: isTransactionType(tx.type) ? tx.type : 'bonus',
        amount: typeof tx.amount === 'number' ? tx.amount : 0,
        description: tx.description ?? '',
        timestamp: tx.timestamp ?? new Date().toISOString(),
        balance: typeof tx.balance === 'number' ? tx.balance : 0,
        status: isTransactionStatus(tx.status) ? tx.status : undefined
      }))
    : [];

  const rawWallet = typeof rawUser.walletBalance === 'number' ? rawUser.walletBalance : undefined;
  const computedWallet = (typeof rawWallet === 'number' && rawWallet > 0)
    ? rawWallet
    : (txs.length ? txs[0].balance : 0);

  return {
    id: rawUser.id ?? crypto.randomUUID(),
    name: rawUser.name ?? '',
    username: rawUser.username ?? '',
    email: rawUser.email ?? '',
    password: rawUser.password ?? '',
    walletBalance: computedWallet,
    winStreak: rawUser.winStreak ?? 0,
    totalWins: rawUser.totalWins ?? 0,
    xp: rawUser.xp ?? 0,
    level: rawUser.level ?? 1,
    lastLogin: rawUser.lastLogin ?? new Date().toISOString(),
    badges: Array.isArray(rawUser.badges) ? rawUser.badges : [],
    friends: Array.isArray(rawUser.friends) ? rawUser.friends : [],
    avatar: rawUser.avatar ?? 'gradient-blue',
    banner: rawUser.banner ?? 'banner-cosmic',
    bio: rawUser.bio ?? '',
    createdAt: rawUser.createdAt ?? new Date().toISOString(),
    transactions: txs,
    referralCode: rawUser.referralCode ?? generateReferralCode(),
    referredBy: rawUser.referredBy,
    referrals: Array.isArray(rawUser.referrals) ? rawUser.referrals : [],
    referralEarnings: rawUser.referralEarnings ?? 0,
    lastBonusClaim: rawUser.lastBonusClaim ?? '',
    loginStreak: rawUser.loginStreak ?? 0,
    totalBonusEarnings: rawUser.totalBonusEarnings ?? 0
  };
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(SESSION_STORAGE_USER_KEY);
  if (!raw) return null;

  try {
    return normalizeStoredUser(JSON.parse(raw) as Partial<StoredUser>);
  } catch {
    return null;
  }
}

export function saveStoredUser(user: Partial<StoredUser>) {
  if (typeof window === 'undefined') return;

  // Merge with existing stored user to avoid wiping fields (transactions, metadata)
  const existing = getStoredUser();
  const merged = normalizeStoredUser({ ...(existing ?? {}), ...(user as Partial<StoredUser>) });

  window.sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(merged));

  // Also update in global users list
  updateGlobalUsers(merged);
}

function updateGlobalUsers(user: StoredUser) {
  if (typeof window === 'undefined') return;

  const raw = window.localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
  let users: StoredUser[] = [];
  if (raw) {
    try {
      users = JSON.parse(raw);
    } catch {
      users = [];
    }
  }

  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }

  window.localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
}

export function getAllUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Partial<StoredUser>[];
    return parsed.map(normalizeStoredUser);
  } catch {
    return [];
  }
}

export function updateWalletBalance(amount: number): StoredUser | null {
  const user = getStoredUser();
  if (!user) return null;

  const updatedUser = { ...user, walletBalance: amount };
  saveStoredUser(updatedUser);
  updateLeaderboard(updatedUser);
  return updatedUser;
}

export function addTransaction(
  type: Transaction['type'],
  amount: number,
  description: string,
  status: Transaction['status'] = 'completed'
): StoredUser | null {
  const user = getStoredUser();
  if (!user) return null;

  const newBalance = user.walletBalance + amount;
  const transaction: Transaction = {
    id: crypto.randomUUID(),
    type,
    amount,
    description,
    timestamp: new Date().toISOString(),
    balance: newBalance,
    status
  };

  const updatedUser = {
    ...user,
    walletBalance: newBalance,
    transactions: [transaction, ...(user.transactions || [])]
  };

  saveStoredUser(updatedUser);
  updateLeaderboard(updatedUser);
  return updatedUser;
}

export function getTransactionHistory(limit: number = 20): Transaction[] {
  const user = getStoredUser();
  if (!user || !user.transactions) return [];
  return user.transactions.slice(0, limit);
}

export function deposit(amount: number): StoredUser | null {
  if (amount <= 0) return null;
  return addTransaction('deposit', amount, `Deposited ₦${amount.toLocaleString()}`);
}

export function withdraw(amount: number): StoredUser | null {
  const user = getStoredUser();
  if (!user || amount <= 0 || amount > user.walletBalance) return null;
  return addTransaction('withdraw', -amount, `Withdrew ₦${amount.toLocaleString()}`);
}

export function checkDailyLoginReward(): StoredUser | null {
  const user = getStoredUser();
  if (!user) return null;

  const today = new Date().toDateString();
  const lastLogin = new Date(user.lastLogin).toDateString();

  if (lastLogin !== today) {
    const reward = 50; // Daily login reward
    const updatedUser = {
      ...user,
      walletBalance: user.walletBalance + reward,
      lastLogin: new Date().toISOString()
    };
    saveStoredUser(updatedUser);
    updateLeaderboard(updatedUser);
    return updatedUser;
  }

  return user;
}

export function updateUserStats(won: boolean, xpGained: number = 10): StoredUser | null {
  const user = getStoredUser();
  if (!user) return null;

  let newStreak = user.winStreak;
  let newTotalWins = user.totalWins;
  let bonus = 0;

  if (won) {
    newStreak += 1;
    newTotalWins += 1;
    if (newStreak === 3) {
      bonus = 100; // Win streak bonus
    }
  } else {
    newStreak = 0;
  }

  const newXp = user.xp + xpGained;
  const newLevel = Math.floor(newXp / 100) + 1; // Level up every 100 XP
  const newBadges = Array.isArray(user.badges) ? [...user.badges] : [];

  if (newLevel > user.level) {
    newBadges.push(`Level ${newLevel} Badge`);
  }

  // Seasonal rewards
  if (newTotalWins >= 10 && !newBadges.includes('Season Champion')) {
    newBadges.push('Season Champion');
  }
  if (newTotalWins >= 50 && !newBadges.includes('Legendary Player')) {
    newBadges.push('Legendary Player');
  }

  const updatedUser = {
    ...user,
    winStreak: newStreak,
    totalWins: newTotalWins,
    xp: newXp,
    level: newLevel,
    badges: newBadges,
    walletBalance: user.walletBalance + bonus
  };

  saveStoredUser(updatedUser);
  updateLeaderboard(updatedUser);
  return updatedUser;
}

export type LeaderboardEntry = {
  id: string;
  username: string;
  level: number;
  xp: number;
  totalWins: number;
  winStreak: number;
  winRate: number;
  lastActive: string;
};

const LEADERBOARD_KEY = 'sofstake-leaderboard';

export function updateLeaderboard(user: StoredUser) {
  if (typeof window === 'undefined') return;

  const totalGames = user.totalWins + (user.xp / 10 - user.totalWins); // Approximate losses
  const winRate = totalGames > 0 ? user.totalWins / totalGames : 0;

  const entry: LeaderboardEntry = {
    id: user.id,
    username: user.username,
    level: user.level,
    xp: user.xp,
    totalWins: user.totalWins,
    winStreak: user.winStreak,
    winRate,
    lastActive: new Date().toISOString()
  };

  const raw = window.localStorage.getItem(LEADERBOARD_KEY);
  let leaderboard: LeaderboardEntry[] = [];
  if (raw) {
    try {
      leaderboard = JSON.parse(raw);
    } catch {
      leaderboard = [];
    }
  }

  const existingIndex = leaderboard.findIndex(e => e.id === user.id);
  if (existingIndex >= 0) {
    leaderboard[existingIndex] = entry;
  } else {
    leaderboard.push(entry);
  }

  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(LEADERBOARD_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getTopPlayersByXp(limit: number = 10): LeaderboardEntry[] {
  const leaderboard = getLeaderboard();
  return leaderboard.sort((a, b) => b.xp - a.xp).slice(0, limit);
}

export function getTopPlayersByWinRate(limit: number = 10): LeaderboardEntry[] {
  const leaderboard = getLeaderboard();
  return leaderboard.sort((a, b) => b.winRate - a.winRate).slice(0, limit);
}

export function getTopPlayersByWins(limit: number = 10): LeaderboardEntry[] {
  const leaderboard = getLeaderboard();
  return leaderboard.sort((a, b) => b.totalWins - a.totalWins).slice(0, limit);
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function processReferral(referralCode: string, newUserId: string): boolean {
  if (typeof window === 'undefined') return false;

  const allUsers = getAllUsers();
  const referrer = allUsers.find(user => user.referralCode === referralCode);

  if (!referrer) return false;

  // Prevent duplicate referral entries
  const referredSet = new Set(referrer.referrals);
  referredSet.add(newUserId);

  const referralBonus = 500; // ₦500 for referrer
  const signupBonus = 300; // ₦300 for new user

  const newUser = allUsers.find(user => user.id === newUserId);
  if (!newUser) return false;

  const updatedReferrer = {
    ...referrer,
    referrals: Array.from(referredSet),
    walletBalance: referrer.walletBalance + referralBonus,
    referralEarnings: referrer.referralEarnings + referralBonus,
    transactions: [
      ...referrer.transactions,
      {
        id: crypto.randomUUID(),
        type: 'referral_bonus' as Transaction['type'],
        amount: referralBonus,
        description: `Referral bonus for inviting ${newUser.username}`,
        timestamp: new Date().toISOString(),
        balance: referrer.walletBalance + referralBonus
      }
    ]
  };

  const updatedNewUser = {
    ...newUser,
    referredBy: referrer.id,
    walletBalance: newUser.walletBalance + signupBonus,
    totalBonusEarnings: (newUser.totalBonusEarnings || 0) + signupBonus,
    transactions: [
      ...newUser.transactions,
      {
        id: crypto.randomUUID(),
        type: 'referral_bonus' as Transaction['type'],
        amount: signupBonus,
        description: `Signup bonus for using referral code ${referralCode}`,
        timestamp: new Date().toISOString(),
        balance: newUser.walletBalance + signupBonus
      }
    ]
  };

  // Save both users
  const otherUsers = allUsers.filter(user => user.id !== referrer.id && user.id !== newUserId);
  const updatedUsers = [...otherUsers, updatedReferrer, updatedNewUser];
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updatedUsers));

  saveStoredUser(updatedNewUser);
  return true;
}

export function giveReferralBonus(referrerId: string, newUserId: string): void {
  const referrer = getAllUsers().find(user => user.id === referrerId);
  if (!referrer) return;

  const bonusAmount = 500; // ₦500 referral bonus
  const updatedReferrer = {
    ...referrer,
    walletBalance: referrer.walletBalance + bonusAmount,
    referralEarnings: referrer.referralEarnings + bonusAmount,
    transactions: [
      ...referrer.transactions,
      {
        id: crypto.randomUUID(),
        type: 'referral_bonus' as Transaction['type'],
        amount: bonusAmount,
        description: `Referral bonus for inviting a friend`,
        timestamp: new Date().toISOString(),
        balance: referrer.walletBalance + bonusAmount
      }
    ]
  };

  saveStoredUser(updatedReferrer);

  // Update in users list
  const allUsers = getAllUsers();
  const updatedUsers = allUsers.map(user =>
    user.id === referrerId ? updatedReferrer : user
  );
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updatedUsers));
}

export function claimDailyBonus(): { success: boolean; amount?: number; streak?: number } {
  const user = getStoredUser();
  if (!user) return { success: false };

  const today = new Date().toDateString();
  const lastClaim = new Date(user.lastBonusClaim).toDateString();

  if (lastClaim === today) {
    return { success: false }; // Already claimed today
  }

  // Calculate bonus based on login streak
  let bonusAmount = 50; // Base daily bonus
  let newStreak = 1;

  // Check if yesterday was claimed (for streak)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  if (lastClaim === yesterdayStr) {
    newStreak = user.loginStreak + 1;
    // Bonus multiplier for streaks
    if (newStreak >= 7) bonusAmount = 200; // Week streak
    else if (newStreak >= 3) bonusAmount = 100; // 3-day streak
  }

  const updatedUser = {
    ...user,
    walletBalance: user.walletBalance + bonusAmount,
    lastBonusClaim: new Date().toISOString(),
    loginStreak: newStreak,
    totalBonusEarnings: user.totalBonusEarnings + bonusAmount,
    transactions: [
      ...user.transactions,
      {
        id: crypto.randomUUID(),
        type: (newStreak > 1 ? 'streak_bonus' : 'daily_bonus') as Transaction['type'],
        amount: bonusAmount,
        description: newStreak > 1 ? `${newStreak}-day login streak bonus` : 'Daily login bonus',
        timestamp: new Date().toISOString(),
        balance: user.walletBalance + bonusAmount
      }
    ]
  };

  saveStoredUser(updatedUser);

  // Update in users list
  const allUsers = getAllUsers();
  const updatedUsers = allUsers.map(u =>
    u.id === user.id ? updatedUser : u
  );
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updatedUsers));

  return { success: true, amount: bonusAmount, streak: newStreak };
}

export function getReferralStats(userId: string): {
  referralCode: string;
  totalReferrals: number;
  referralEarnings: number;
  pendingBonuses: number;
} {
  const user = getAllUsers().find(u => u.id === userId);
  if (!user) return { referralCode: '', totalReferrals: 0, referralEarnings: 0, pendingBonuses: 0 };

  return {
    referralCode: user.referralCode,
    totalReferrals: Array.isArray(user.referrals) ? user.referrals.length : 0,
    referralEarnings: user.referralEarnings ?? 0,
    pendingBonuses: 0 // Could implement pending bonuses later
  };
}

export function getTopPlayersByStreak(limit: number = 10): LeaderboardEntry[] {
  const leaderboard = getLeaderboard();
  return leaderboard.sort((a, b) => b.winStreak - a.winStreak).slice(0, limit);
}

export function addFriend(friendId: string): StoredUser | null {
  const user = getStoredUser();
  if (!user || user.friends.includes(friendId)) return user;

  const updatedUser = { ...user, friends: [...user.friends, friendId] };
  saveStoredUser(updatedUser);
  return updatedUser;
}

export function removeFriend(friendId: string): StoredUser | null {
  const user = getStoredUser();
  if (!user) return null;

  const updatedUser = { ...user, friends: user.friends.filter(id => id !== friendId) };
  saveStoredUser(updatedUser);
  return updatedUser;
}

export function getFriends(): StoredUser[] {
  const user = getStoredUser();
  if (!user) return [];

  const allUsers = getAllUsers();
  return allUsers.filter(u => user.friends.includes(u.id));
}
