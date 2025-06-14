/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Savings` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyTarget` on the `Shares` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,erp_id]` on the table `Biodata` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[erp_id,month,year]` on the table `Savings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[erp_id,month,year]` on the table `Shares` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `erp_id` to the `Savings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `Savings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Savings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `erp_id` to the `Shares` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `Shares` table without a default value. This is not possible if the table is not empty.
  - Added the required column `savingsId` to the `Shares` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Shares` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Savings" DROP CONSTRAINT "Savings_memberId_fkey";

-- DropIndex
DROP INDEX "Savings_memberId_idx";

-- AlterTable
ALTER TABLE "Savings" DROP COLUMN "updatedAt",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "erp_id" TEXT NOT NULL,
ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "month" INTEGER NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Shares" DROP COLUMN "monthlyTarget",
ADD COLUMN     "erp_id" TEXT NOT NULL,
ADD COLUMN     "month" INTEGER NOT NULL,
ADD COLUMN     "monthly_amount" DECIMAL(15,2) NOT NULL DEFAULT 3000,
ADD COLUMN     "savingsId" UUID NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Biodata_id_erp_id_key" ON "Biodata"("id", "erp_id");

-- CreateIndex
CREATE INDEX "Savings_memberId_erp_id_idx" ON "Savings"("memberId", "erp_id");

-- CreateIndex
CREATE UNIQUE INDEX "Savings_erp_id_month_year_key" ON "Savings"("erp_id", "month", "year");

-- CreateIndex
CREATE INDEX "Shares_erp_id_idx" ON "Shares"("erp_id");

-- CreateIndex
CREATE UNIQUE INDEX "Shares_erp_id_month_year_key" ON "Shares"("erp_id", "month", "year");

-- AddForeignKey
ALTER TABLE "Savings" ADD CONSTRAINT "Savings_memberId_erp_id_fkey" FOREIGN KEY ("memberId", "erp_id") REFERENCES "Biodata"("id", "erp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shares" ADD CONSTRAINT "Shares_savingsId_fkey" FOREIGN KEY ("savingsId") REFERENCES "Savings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
