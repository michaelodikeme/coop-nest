-- AlterTable
ALTER TABLE "Savings" ADD COLUMN     "totalGrossAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "totalSavingsAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Shares" ADD COLUMN     "totalSharesAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;
