-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionStatus" ADD VALUE 'pending';
ALTER TYPE "TransactionStatus" ADD VALUE 'completed';
ALTER TYPE "TransactionStatus" ADD VALUE 'failed';
ALTER TYPE "TransactionStatus" ADD VALUE 'reversed';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'deposit';
ALTER TYPE "TransactionType" ADD VALUE 'withdraw';
ALTER TYPE "TransactionType" ADD VALUE 'withdraw_request';
ALTER TYPE "TransactionType" ADD VALUE 'refund';
ALTER TYPE "TransactionType" ADD VALUE 'mining';
ALTER TYPE "TransactionType" ADD VALUE 'stake_lock';
ALTER TYPE "TransactionType" ADD VALUE 'stake_release';
ALTER TYPE "TransactionType" ADD VALUE 'stake_early_release';
ALTER TYPE "TransactionType" ADD VALUE 'daily_bonus';
ALTER TYPE "TransactionType" ADD VALUE 'stake';
ALTER TYPE "TransactionType" ADD VALUE 'stake_payout';

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ADD COLUMN     "lastBonusClaim" TIMESTAMP(3),
ADD COLUMN     "loginStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "totalBonusEarnings" DECIMAL(30,10) NOT NULL DEFAULT 0,
ADD COLUMN     "walletBalance" DECIMAL(30,10) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "sofBalance" DECIMAL(30,10) NOT NULL DEFAULT 0,
ADD COLUMN     "usdBalance" DECIMAL(30,10) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(30,10) NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountSof" DECIMAL(30,10) NOT NULL,
    "amountUsd" DECIMAL(30,10) NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT,
    "adminId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiningClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountSof" DECIMAL(30,10) NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakDay" INTEGER NOT NULL,
    "deviceFingerprint" TEXT,

    CONSTRAINT "MiningClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(30,10) NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "stakePlan" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reward" DECIMAL(30,10) NOT NULL,
    "payoutAmount" DECIMAL(30,10) NOT NULL,
    "status" TEXT NOT NULL,
    "penaltyApplied" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_reference_key" ON "WalletTransaction"("reference");

-- CreateIndex
CREATE INDEX "WalletTransaction_userId_idx" ON "WalletTransaction"("userId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_userId_idx" ON "WithdrawalRequest"("userId");

-- CreateIndex
CREATE INDEX "MiningClaim_userId_idx" ON "MiningClaim"("userId");

-- CreateIndex
CREATE INDEX "MiningClaim_claimedAt_idx" ON "MiningClaim"("claimedAt");

-- CreateIndex
CREATE INDEX "Staking_userId_idx" ON "Staking"("userId");

-- CreateIndex
CREATE INDEX "Staking_createdAt_idx" ON "Staking"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiningClaim" ADD CONSTRAINT "MiningClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staking" ADD CONSTRAINT "Staking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
