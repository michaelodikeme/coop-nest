-- DropIndex
DROP INDEX "Session_userId_idx";

-- CreateIndex
CREATE INDEX "Session_userId_deviceInfo_isActive_idx" ON "Session"("userId", "deviceInfo", "isActive");
