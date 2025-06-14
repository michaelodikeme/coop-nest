/*
  Warnings:

  - The values [REVIEWED] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "LoanStatus" ADD VALUE 'REVIEWED';

-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');
ALTER TABLE "Request" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Request" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "RequestStatus_old";
ALTER TABLE "Request" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
