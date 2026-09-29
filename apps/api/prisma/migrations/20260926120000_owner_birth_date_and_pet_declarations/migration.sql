-- Existing Yes/No values stay Yes/No. PreferNotToSay is only chosen explicitly.
-- Gender Other and Temperament Custom are additive. Existing rows are unchanged.
ALTER TYPE "Gender" ADD VALUE 'Other';
ALTER TYPE "Vaccinated" ADD VALUE 'PreferNotToSay';
ALTER TYPE "Desexed" ADD VALUE 'PreferNotToSay';
ALTER TYPE "Temperament" ADD VALUE 'Custom';

ALTER TABLE "User" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "Pet" ADD COLUMN "customTemperament" TEXT;
