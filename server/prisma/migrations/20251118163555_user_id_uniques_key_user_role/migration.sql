/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `user_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_key" ON "user_roles"("userId");
