-- Convert Pet.temperament from single enum to enum array (multi-select).
ALTER TABLE "Pet" ALTER COLUMN "temperament" DROP DEFAULT;
ALTER TABLE "Pet"
  ALTER COLUMN "temperament" TYPE "Temperament"[]
  USING ARRAY["temperament"]::"Temperament"[];
ALTER TABLE "Pet"
  ALTER COLUMN "temperament" SET DEFAULT ARRAY['Happy']::"Temperament"[];
