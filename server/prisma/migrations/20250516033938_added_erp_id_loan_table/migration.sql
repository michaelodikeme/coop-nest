/*
  Warnings:

  - Added the required column `erp_id` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "erp_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Loan_erp_id_idx" ON "Loan"("erp_id");
