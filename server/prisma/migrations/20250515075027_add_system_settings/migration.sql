/*
  Warnings:

  - The values [SHARES_LIQUIDATION,SHARES_DIVIDEND,LOAN_PENALTY] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SHARE_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE 'SAVINGS_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE 'LOAN_UPDATE';

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('CREDIT', 'DEBIT', 'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL', 'SAVINGS_INTEREST', 'SHARES_PURCHASE', 'SHARES_WITHDRAWAL', 'SHARES_ADJUSTMENT_INCREASE', 'SHARES_ADJUSTMENT_DECREASE', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'LOAN_INTEREST', 'FEE', 'REVERSAL', 'ADJUSTMENT');
ALTER TABLE "Transaction" ALTER COLUMN "transactionType" TYPE "TransactionType_new" USING ("transactionType"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings_history" (
    "id" UUID NOT NULL,
    "settingId" UUID NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "updatedBy" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "system_settings_history" ADD CONSTRAINT "system_settings_history_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "system_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
