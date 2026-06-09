import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient, GameType, MatchStatus, TransactionStatus, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();
const port = Number(process.env.SOCKET_PORT || 4000);
const fee = Number(process.env.PLATFORM_FEE || 0.1);

type MatchRequest = {
  socketId: string;
  userId: string;
  stake: number;
  gameType: GameType;
  createdAt: number;
};

type ActiveMatch = {
  id: string;
  player1Id: string;
  player2Id?: string;
  botName?: string;
  gameType: GameType;
  stake: number;
};

const queue = new Map<string, MatchRequest>();
const activeMatches = new Map<string, ActiveMatch>();
const userSockets = new Map<string, string>();

const bots = [
  { name: 'Shadow', difficulty: 'easy' },
  { name: 'Nova', difficulty: 'medium' },
  { name: 'Apex', difficulty: 'hard' }
];

function randomFromRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBotOutcome(difficulty: string) {
  const rand = Math.random();
  if (difficulty === 'easy') return rand < 0.6 ? 'player' : 'bot';
  if (difficulty === 'medium') return rand < 0.48 ? 'player' : 'bot';
  return rand < 0.4 ? 'player' : 'bot';
}

function createBot(gameType: GameType) {
  const bot = bots[randomFromRange(0, bots.length - 1)];
  return {
    name: bot.name,
    difficulty: bot.difficulty,
    score: gameType === 'dice' ? randomFromRange(2, 6) : randomFromRange(40, 100)
  };
}

async function recordTransaction(userId: string, type: TransactionType, amount: number, status: TransactionStatus, reference?: string, metadata?: object) {
  await prisma.walletTransaction.create({
    data: {
      userId,
      type,
      amount,
      status,
      reference,
      metadata
    }
  });
}

async function settleMatch(match: ActiveMatch, winnerId: string | null, tie: boolean) {
  const matchRecord = await prisma.gameMatch.update({
    where: { id: match.id },
    data: {
      winnerId: winnerId ?? undefined,
      status: tie ? MatchStatus.refunded : MatchStatus.completed
    }
  });

  if (tie) {
    await prisma.user.update({
      where: { id: match.player1Id },
      data: { walletBalance: { increment: match.stake } }
    });
    await recordTransaction(match.player1Id, TransactionType.refund, match.stake, TransactionStatus.completed, undefined, { reason: 'tie' });
    return;
  }

  const payout = match.stake * 2 * (1 - fee);
  await prisma.user.update({ where: { id: winnerId! }, data: { walletBalance: { increment: payout } } });
  await recordTransaction(winnerId!, TransactionType.win, payout, TransactionStatus.completed, undefined, { matchId: match.id, fee });
}

const httpServer = http.createServer();
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('identify', ({ userId }: { userId: string }) => {
    userSockets.set(userId, socket.id);
    socket.data.userId = userId;
  });

  socket.on('find_match', async ({ userId, stake, gameType }: { userId: string; stake: number; gameType: GameType }) => {
    const active = Array.from(activeMatches.values()).find((match) => match.player1Id === userId || match.player2Id === userId);
    if (active) {
      socket.emit('match_error', { message: 'You already have an active match.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletBalance < stake) {
      socket.emit('match_error', { message: 'Insufficient wallet balance or user not found.' });
      return;
    }

    await prisma.user.update({ where: { id: userId }, data: { walletBalance: { decrement: stake } } });
    await recordTransaction(userId, TransactionType.bet, stake, TransactionStatus.completed, undefined, { gameType });

    const existing = Array.from(queue.values()).find((request) => request.gameType === gameType && request.userId !== userId);
    if (existing) {
      queue.delete(existing.userId);
      const matchRecord = await prisma.gameMatch.create({
        data: {
          player1Id: existing.userId,
          player2Id: userId,
          gameType,
          stake,
          status: MatchStatus.active
        }
      });
      const activeMatch: ActiveMatch = {
        id: matchRecord.id,
        player1Id: existing.userId,
        player2Id: userId,
        gameType,
        stake
      };
      activeMatches.set(matchRecord.id, activeMatch);

      [existing.socketId, socket.id].forEach((socketId) => {
        io.to(socketId).emit('match_found', {
          id: matchRecord.id,
          player1Id: existing.userId,
          player2Id: userId,
          gameType,
          stake
        });
      });
      return;
    }

    const request: MatchRequest = { socketId: socket.id, userId, stake, gameType, createdAt: Date.now() };
    queue.set(userId, request);

    setTimeout(async () => {
      const queued = queue.get(userId);
      if (!queued) return;
      queue.delete(userId);
      const bot = createBot(gameType);
      const matchRecord = await prisma.gameMatch.create({
        data: {
          player1Id: userId,
          botName: bot.name,
          gameType,
          stake,
          status: MatchStatus.active
        }
      });
      const activeMatch: ActiveMatch = {
        id: matchRecord.id,
        player1Id: userId,
        botName: bot.name,
        gameType,
        stake
      };
      activeMatches.set(matchRecord.id, activeMatch);
      io.to(socket.id).emit('match_found', {
        id: matchRecord.id,
        player1Id: userId,
        botName: bot.name,
        difficulty: bot.difficulty,
        gameType,
        stake
      });
      socket.data.pendingBot = bot;
    }, 8000);
  });

  socket.on('player_action', async ({ matchId, gameType }: { matchId: string; gameType: GameType }) => {
    const match = activeMatches.get(matchId);
    if (!match) {
      socket.emit('match_error', { message: 'Match not found.' });
      return;
    }

    const userId = socket.data.userId as string;
    if (match.player1Id !== userId && match.player2Id !== userId) {
      socket.emit('match_error', { message: 'Not authorized for this match.' });
      return;
    }

    const userRoll = gameType === 'dice' ? randomFromRange(1, 6) : randomFromRange(10, 100);
    let opponentRoll: number;
    let opponentName = 'Opponent';
    let tie = false;
    let winnerId: string | null = null;

    if (match.player2Id) {
      opponentName = 'Rival';
      opponentRoll = gameType === 'dice' ? randomFromRange(1, 6) : randomFromRange(10, 100);
      if (userRoll === opponentRoll) tie = true;
      else winnerId = userRoll > opponentRoll ? userId : match.player2Id;
    } else {
      const bot = socket.data.pendingBot || createBot(gameType);
      opponentName = bot.name;
      opponentRoll = bot.score;
      const outcome = getBotOutcome(bot.difficulty);
      if (outcome === 'player') winnerId = userId;
      else winnerId = null;
      if (!winnerId) {
        tie = false;
      }
    }

    if (tie) {
      await settleMatch(match, null, true);
      activeMatches.delete(matchId);
      io.to(socket.id).emit('match_complete', { message: 'Tie! Stake refunded.' });
      return;
    }

    if (!winnerId) {
      activeMatches.delete(matchId);
      io.to(socket.id).emit('match_complete', { message: 'You lost the round. Better luck next time.', result: { userRoll, opponentRoll } });
      return;
    }

    await settleMatch(match, winnerId, false);
    activeMatches.delete(matchId);
    io.to(socket.id).emit('match_complete', { message: winnerId === userId ? 'You won! Payout delivered.' : 'You lost the match.', result: { userRoll, opponentRoll } });
  });

  socket.on('aviator_start_round', async ({ userId, stake }: { userId: string; stake: number }) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.walletBalance < stake) {
      socket.emit('match_error', { message: 'Insufficient balance.' });
      return;
    }

    // Deduct stake
    await prisma.user.update({ where: { id: userId }, data: { walletBalance: { decrement: stake } } });

    // Generate random crash point
    const crashPoint = Math.floor(Math.random() * 980) / 100 + 1.01;

    // Create round in database
    const round = await prisma.aviatorRound.create({
      data: {
        roundNumber: 1,
        crashPoint: crashPoint,
        status: 'active'
      }
    });

    // Create bet
    await prisma.aviatorBet.create({
      data: {
        userId,
        roundId: round.id,
        stake: stake,
        betStatus: 'active'
      }
    });

    socket.emit('aviator_round_started', { roundId: round.id, crashPoint });
  });

  socket.on('aviator_cash_out', async ({ userId, roundId, cashOutAt, stake }: { userId: string; roundId: string; cashOutAt: number; stake: number }) => {
    const round = await prisma.aviatorRound.findUnique({ where: { id: roundId } });
    if (!round) {
      socket.emit('match_error', { message: 'Round not found.' });
      return;
    }

    if (cashOutAt >= round.crashPoint) {
      // Player crashed
      socket.emit('aviator_crashed', { crashPoint: round.crashPoint, payout: 0 });
      return;
    }

    // Player cashed out successfully
    const payout = Math.floor(stake * cashOutAt * (1 - fee));
    
    // Update user wallet
    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: payout } }
    });

    // Update bet
    await prisma.aviatorBet.update({
      where: {
        id: (await prisma.aviatorBet.findFirst({ where: { userId, roundId } }))?.id || ''
      },
      data: {
        cashOutAt,
        betStatus: 'won',
        payout
      }
    });

    socket.emit('aviator_cashed_out', { cashOutAt, payout });
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId as string | undefined;
    if (userId) {
      userSockets.delete(userId);
      queue.delete(userId);
    }
  });
});

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Socket server listening on http://localhost:${port}`);
});
