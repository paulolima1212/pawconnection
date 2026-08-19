-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locationUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_latitude_longitude_idx" ON "User"("latitude", "longitude");
