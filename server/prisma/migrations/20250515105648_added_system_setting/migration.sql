/*
  Warnings:

  - The values [SHARE_UPDATE,SAVINGS_UPDATE,LOAN_UPDATE] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [SHARES_WITHDRAWAL,SHARES_ADJUSTMENT_INCREASE,SHARES_ADJUSTMENT_DECREASE] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `system_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_settings_history` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('TRANSACTION', 'REQUEST_UPDATE', 'APPROVAL_REQUIRED', 'SYSTEM_ALERT', 'ACCOUNT_UPDATE');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('CREDIT', 'DEBIT', 'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL', 'SAVINGS_INTEREST', 'SHARES_PURCHASE', 'SHARES_LIQUIDATION', 'SHARES_DIVIDEND', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'LOAN_INTEREST', 'LOAN_PENALTY', 'FEE', 'REVERSAL', 'ADJUSTMENT');
ALTER TABLE "Transaction" ALTER COLUMN "transactionType" TYPE "TransactionType_new" USING ("transactionType"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "system_settings_history" DROP CONSTRAINT "system_settings_history_settingId_fkey";

-- DropTable
DROP TABLE "system_settings";

-- DropTable
DROP TABLE "system_settings_history";

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettingsHistory" (
    "id" UUID NOT NULL,
    "settingId" UUID NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "updatedBy" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSettingsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_group_idx" ON "SystemSettings"("group");

-- CreateIndex
CREATE INDEX "SystemSettingsHistory_settingId_idx" ON "SystemSettingsHistory"("settingId");

-- AddForeignKey
ALTER TABLE "SystemSettingsHistory" ADD CONSTRAINT "SystemSettingsHistory_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "SystemSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
