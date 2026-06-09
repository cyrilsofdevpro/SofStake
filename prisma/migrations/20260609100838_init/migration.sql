/*
  Warnings:

  - You are about to drop the column `result` on the `Bet` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Bet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,10)`.
  - You are about to alter the column `payout` on the `Bet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,10)`.
  - You are about to drop the column `currency` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `LedgerEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,10)`.
  - You are about to alter the column `balanceAfter` on the `LedgerEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,10)`.
  - The `metadata` column on the `LedgerEntry` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `claimedAt` on the `MiningReward` table. All the data in the column will be lost.
  - You are about to drop the column `dailyReward` on the `MiningReward` table. All the data in the column will be lost.
  - You are about to drop the column `streakDay` on the `MiningReward` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Referral` table. All the data in the column will be lost.
  - You are about to drop the column `refereeId` on the `Referral` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(30,10)`.
  - The `status` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `metadata` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `badges` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `banner` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `friends` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastBonusClaim` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `loginStreak` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `referralCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `referralEarnings` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `referrals` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `referredBy` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalBonusEarnings` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `walletBalance` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `sofBalance` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the column `usdBalance` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the `AnalyticsEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EconomyPool` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameMatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MiningClaim` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Staking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WalletTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WithdrawalRequest` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `Bet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionId]` on the table `LedgerEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[referrerId,referredId]` on the table `Referral` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `prediction` to the `Bet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceBefore` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `LedgerEntry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `amount` to the `MiningReward` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referredId` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BET', 'REWARD', 'REFERRAL', 'MINING', 'FEE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'CANCELED', 'SETTLED');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('PENDING', 'HOME', 'AWAY', 'DRAW', 'CANCELED');

-- DropForeignKey
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_userId_fkey";

-- DropForeignKey
ALTER TABLE "GameMatch" DROP CONSTRAINT "GameMatch_player1Id_fkey";

-- DropForeignKey
ALTER TABLE "GameMatch" DROP CONSTRAINT "GameMatch_player2Id_fkey";

-- DropForeignKey
ALTER TABLE "GameMatch" DROP CONSTRAINT "GameMatch_winnerId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_walletId_fkey";

-- DropForeignKey
ALTER TABLE "MiningClaim" DROP CONSTRAINT "MiningClaim_userId_fkey";

-- DropForeignKey
ALTER TABLE "MiningReward" DROP CONSTRAINT "MiningReward_userId_fkey";

-- DropForeignKey
ALTER TABLE "Staking" DROP CONSTRAINT "Staking_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT "WithdrawalRequest_userId_fkey";

-- DropIndex
DROP INDEX "User_referralCode_key";

-- AlterTable
ALTER TABLE "Bet" DROP COLUMN "result",
ADD COLUMN     "fee" DECIMAL(30,10) NOT NULL DEFAULT 0,
ADD COLUMN     "matchId" TEXT,
ADD COLUMN     "prediction" TEXT NOT NULL,
ADD COLUMN     "status" "BetStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transactionId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(30,10),
ALTER COLUMN "payout" SET DATA TYPE DECIMAL(30,10);

-- AlterTable
ALTER TABLE "LedgerEntry" DROP COLUMN "currency",
DROP COLUMN "source",
ADD COLUMN     "balanceBefore" DECIMAL(30,10) NOT NULL,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "transactionId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(30,10),
ALTER COLUMN "balanceAfter" SET DATA TYPE DECIMAL(30,10),
DROP COLUMN "metadata",
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "MiningReward" DROP COLUMN "claimedAt",
DROP COLUMN "dailyReward",
DROP COLUMN "streakDay",
ADD COLUMN     "amount" DECIMAL(30,10) NOT NULL,
ADD COLUMN     "miningSessionId" TEXT,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "Referral" DROP COLUMN "amount",
DROP COLUMN "level",
DROP COLUMN "refereeId",
ADD COLUMN     "referredId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerRef" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(30,10),
DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "metadata",
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatar",
DROP COLUMN "badges",
DROP COLUMN "banner",
DROP COLUMN "bio",
DROP COLUMN "emailVerified",
DROP COLUMN "friends",
DROP COLUMN "image",
DROP COLUMN "lastBonusClaim",
DROP COLUMN "level",
DROP COLUMN "loginStreak",
DROP COLUMN "name",
DROP COLUMN "password",
DROP COLUMN "referralCode",
DROP COLUMN "referralEarnings",
DROP COLUMN "referrals",
DROP COLUMN "referredBy",
DROP COLUMN "totalBonusEarnings",
DROP COLUMN "walletBalance",
DROP COLUMN "xp",
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "sofBalance",
DROP COLUMN "usdBalance",
ADD COLUMN     "balance" DECIMAL(30,10) NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lockedBalance" DECIMAL(30,10) NOT NULL DEFAULT 0,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "AnalyticsEvent";

-- DropTable
DROP TABLE "EconomyPool";

-- DropTable
DROP TABLE "GameMatch";

-- DropTable
DROP TABLE "MiningClaim";

-- DropTable
DROP TABLE "Staking";

-- DropTable
DROP TABLE "WalletTransaction";

-- DropTable
DROP TABLE "WithdrawalRequest";

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "odds" JSONB NOT NULL,
    "result" "MatchResult" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "rewardRate" DECIMAL(30,10) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(30,10) NOT NULL,
    "sourceUserId" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_createdAt_idx" ON "Match"("createdAt");

-- CreateIndex
CREATE INDEX "MiningSession_userId_idx" ON "MiningSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_transactionId_key" ON "ReferralReward"("transactionId");

-- CreateIndex
CREATE INDEX "ReferralReward_userId_idx" ON "ReferralReward"("userId");

-- CreateIndex
CREATE INDEX "ReferralReward_createdAt_idx" ON "ReferralReward"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_transactionId_key" ON "Bet"("transactionId");

-- CreateIndex
CREATE INDEX "Bet_userId_idx" ON "Bet"("userId");

-- CreateIndex
CREATE INDEX "Bet_createdAt_idx" ON "Bet"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_transactionId_key" ON "LedgerEntry"("transactionId");

-- CreateIndex
CREATE INDEX "LedgerEntry_walletId_idx" ON "LedgerEntry"("walletId");

-- CreateIndex
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");

-- CreateIndex
CREATE INDEX "MiningReward_userId_idx" ON "MiningReward"("userId");

-- CreateIndex
CREATE INDEX "MiningReward_createdAt_idx" ON "MiningReward"("createdAt");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referrerId_referredId_key" ON "Referral"("referrerId", "referredId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiningSession" ADD CONSTRAINT "MiningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiningReward" ADD CONSTRAINT "MiningReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiningReward" ADD CONSTRAINT "MiningReward_miningSessionId_fkey" FOREIGN KEY ("miningSessionId") REFERENCES "MiningSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
