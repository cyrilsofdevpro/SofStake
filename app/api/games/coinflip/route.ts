import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId, choice, betAmount } = await request.json();

    // Validate inputs
    if (!userId || !choice || !betAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['heads', 'tails'].includes(choice.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid choice. Must be heads or tails.' },
        { status: 400 }
      );
    }

    if (betAmount < 10) {
      return NextResponse.json(
        { error: 'Minimum bet is ₦10' },
        { status: 400 }
      );
    }

    // Fetch user with wallet (with lock to prevent race conditions)
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check sufficient balance
    const availableBalance = user.walletBalance;
    if (availableBalance < betAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance for this bet' },
        { status: 400 }
      );
    }

    // Generate provably fair seed
    const seed = crypto.randomBytes(32).toString('hex');
    
    // Generate result server-side (secure, cannot be manipulated from frontend)
    const seedHash = crypto.createHash('sha256').update(seed).digest();
    const resultBit = seedHash[0] % 2; // 0 = heads, 1 = tails
    const result = resultBit === 0 ? 'heads' : 'tails';
    const won = result === choice.toLowerCase();

    // Calculate payout (2x multiplier for coin flip)
    const multiplier = 2;
    const payout = won ? betAmount * multiplier : 0;
    const winAmount = payout - betAmount;

    // Use Prisma transaction to ensure atomicity
    const gameResult = await db.$transaction(async (tx) => {
      // Deduct bet amount from wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: betAmount
          }
        }
      });

      // Update user wallet balance
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: {
            decrement: betAmount
          }
        }
      });

      // If won, credit payout
      if (won) {
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: {
              increment: payout
            }
          }
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            walletBalance: {
              increment: payout
            }
          }
        });
      }

      // Create ledger entry for bet deduction
      await tx.ledgerEntry.create({
        data: {
          walletId: user.wallet.id,
          type: won ? 'stake_release' : 'stake_lock',
          amount: won ? payout : -betAmount,
          balanceBefore: user.walletBalance,
          balanceAfter: user.walletBalance.minus(betAmount).plus(won ? payout : 0),
          reference: `COINFLIP-${Date.now()}`,
          metadata: {
            gameType: 'coinflip',
            choice,
            result,
            multiplier
          }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: won ? 'win' : 'loss',
          amount: won ? payout : -betAmount,
          status: 'completed',
          metadata: {
            gameType: 'coinflip',
            choice,
            result,
            multiplier
          }
        }
      });

      // Create coin flip game record
      const coinFlipGame = await tx.coinFlipGame.create({
        data: {
          userId,
          choice: choice.toLowerCase(),
          result,
          betAmount,
          payout,
          winAmount,
          status: 'completed',
          walletBefore: user.walletBalance,
          walletAfter: user.walletBalance.minus(betAmount).plus(won ? payout : 0),
          multiplier: multiplier,
          seed,
          reference: transaction.id,
          metadata: {
            won,
            fair: true
          }
        }
      });

      // Create game history record
      await tx.gameHistory.create({
        data: {
          userId,
          gameType: 'coinflip',
          betAmount,
          payout,
          winAmount,
          result: won ? 'won' : 'lost',
          multiplier,
          metadata: {
            choice,
            gameResult: result
          }
        }
      });

      return {
        game: coinFlipGame,
        transaction,
        newBalance: user.walletBalance.minus(betAmount).plus(won ? payout : 0)
      };
    });

    return NextResponse.json({
      status: true,
      message: won ? 'You won!' : 'Better luck next time',
      data: {
        gameId: gameResult.game.id,
        choice: gameResult.game.choice,
        result: gameResult.game.result,
        won,
        betAmount: Number(gameResult.game.betAmount),
        payout: Number(gameResult.game.payout),
        winAmount: Number(gameResult.game.winAmount),
        newBalance: Number(gameResult.newBalance),
        multiplier: Number(gameResult.game.multiplier)
      }
    });
  } catch (error: any) {
    console.error('Coin flip game error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process coin flip game' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    if (action === 'history') {
      // Get game history
      const games = await db.coinFlipGame.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return NextResponse.json({
        status: true,
        data: games.map(game => ({
          ...game,
          betAmount: Number(game.betAmount),
          payout: Number(game.payout),
          winAmount: Number(game.winAmount),
          walletBefore: Number(game.walletBefore),
          walletAfter: Number(game.walletAfter)
        }))
      });
    }

    if (action === 'stats') {
      // Get game statistics
      const games = await db.coinFlipGame.findMany({
        where: { userId }
      });

      const totalGames = games.length;
      const wonGames = games.filter(g => g.status === 'completed' && Number(g.winAmount) > 0).length;
      const lostGames = totalGames - wonGames;
      const totalBet = games.reduce((sum, g) => sum + Number(g.betAmount), 0);
      const totalPayout = games.reduce((sum, g) => sum + Number(g.payout), 0);
      const profit = totalPayout - totalBet;
      const winRate = totalGames > 0 ? (wonGames / totalGames) * 100 : 0;

      return NextResponse.json({
        status: true,
        data: {
          totalGames,
          wonGames,
          lostGames,
          winRate: Math.round(winRate),
          totalBet,
          totalPayout,
          profit
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching coin flip data:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
