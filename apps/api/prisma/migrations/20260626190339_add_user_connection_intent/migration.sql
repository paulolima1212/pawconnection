-- CreateEnum
CREATE TYPE "ConnectionIntent" AS ENUM ('Friendship', 'Relationship', 'CasualDating', 'MeetPeople');

-- CreateTable
CREATE TABLE "UserConnectionIntent" (
    "userId" TEXT NOT NULL,
    "intent" "ConnectionIntent" NOT NULL,

    CONSTRAINT "UserConnectionIntent_pkey" PRIMARY KEY ("userId","intent")
);

-- AddForeignKey
ALTER TABLE "UserConnectionIntent" ADD CONSTRAINT "UserConnectionIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
