-- CreateEnum
CREATE TYPE "Desexed" AS ENUM ('Yes', 'No');

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN "desexed" "Desexed" NOT NULL DEFAULT 'No';
