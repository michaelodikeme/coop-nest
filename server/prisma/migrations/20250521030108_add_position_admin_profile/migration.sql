/*
  Warnings:

  - Added the required column `position` to the `admin_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admin_profiles" ADD COLUMN     "position" TEXT NOT NULL;
