-- DropForeignKey
ALTER TABLE "admin_profiles" DROP CONSTRAINT "admin_profiles_userId_fkey";

-- AlterTable
ALTER TABLE "admin_profiles" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
