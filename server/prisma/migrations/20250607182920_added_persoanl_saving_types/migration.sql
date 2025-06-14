/*
  Warnings:

  - Added the required column `planTypeId` to the `PersonalSavings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PersonalSavings" ADD COLUMN     "planTypeId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "PersonalSavingsPlan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalSavingsPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonalSavingsPlan_name_key" ON "PersonalSavingsPlan"("name");

-- CreateIndex
CREATE INDEX "PersonalSavings_planTypeId_idx" ON "PersonalSavings"("planTypeId");

-- AddForeignKey
ALTER TABLE "PersonalSavings" ADD CONSTRAINT "PersonalSavings_planTypeId_fkey" FOREIGN KEY ("planTypeId") REFERENCES "PersonalSavingsPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
