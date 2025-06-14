-- CreateEnum
CREATE TYPE "PersonalSavingsStatus" AS ENUM ('ACTIVE', 'CLOSED', 'SUSPENDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestType" ADD VALUE 'PERSONAL_SAVINGS_CREATION';
ALTER TYPE "RequestType" ADD VALUE 'PERSONAL_SAVINGS_WITHDRAWAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'PERSONAL_SAVINGS_DEPOSIT';
ALTER TYPE "TransactionType" ADD VALUE 'PERSONAL_SAVINGS_WITHDRAWAL';

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "personalSavingsId" UUID;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "personalSavingsId" UUID;

-- CreateTable
CREATE TABLE "PersonalSavings" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "erp_id" TEXT NOT NULL,
    "planName" TEXT,
    "targetAmount" DECIMAL(15,2),
    "currentBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "PersonalSavingsStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalSavings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalSavings_memberId_erp_id_idx" ON "PersonalSavings"("memberId", "erp_id");

-- CreateIndex
CREATE INDEX "PersonalSavings_status_idx" ON "PersonalSavings"("status");

-- CreateIndex
CREATE INDEX "Request_personalSavingsId_idx" ON "Request"("personalSavingsId");

-- CreateIndex
CREATE INDEX "Transaction_personalSavingsId_idx" ON "Transaction"("personalSavingsId");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_personalSavingsId_fkey" FOREIGN KEY ("personalSavingsId") REFERENCES "PersonalSavings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_personalSavingsId_fkey" FOREIGN KEY ("personalSavingsId") REFERENCES "PersonalSavings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalSavings" ADD CONSTRAINT "PersonalSavings_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Biodata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
