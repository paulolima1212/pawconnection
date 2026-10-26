-- Friendship lifecycle, one bidirectional row per pair, and post visibility.
ALTER TYPE "RequestStatus" ADD VALUE 'cancelled';
ALTER TYPE "RequestStatus" ADD VALUE 'removed';

CREATE TYPE "FriendRequestPolicy" AS ENUM ('everyone', 'friends_of_friends', 'nobody');
CREATE TYPE "FriendsListVisibility" AS ENUM ('everyone', 'friends', 'only_me');
CREATE TYPE "PostVisibility" AS ENUM ('public', 'friends', 'private');

ALTER TABLE "User"
  ADD COLUMN "friendRequestPolicy" "FriendRequestPolicy" NOT NULL DEFAULT 'everyone',
  ADD COLUMN "friendsListVisibility" "FriendsListVisibility" NOT NULL DEFAULT 'everyone',
  ADD COLUMN "defaultPostVisibility" "PostVisibility" NOT NULL DEFAULT 'public';

ALTER TABLE "Post"
  ADD COLUMN "visibility" "PostVisibility" NOT NULL DEFAULT 'public';

ALTER TABLE "ConnectionRequest"
  ADD COLUMN "userLowId" TEXT,
  ADD COLUMN "userHighId" TEXT,
  ADD COLUMN "acceptedAt" TIMESTAMP(3);

UPDATE "ConnectionRequest"
SET
  "userLowId" = LEAST("senderId", "recipientId"),
  "userHighId" = GREATEST("senderId", "recipientId"),
  "acceptedAt" = CASE WHEN "status" = 'accepted' THEN "updatedAt" ELSE NULL END;

-- Keep one row per canonical pair and type. Prefer an accepted friendship, otherwise the newest row.
DELETE FROM "ConnectionRequest"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY LEAST("senderId", "recipientId"), GREATEST("senderId", "recipientId"), "type"
        ORDER BY
          CASE WHEN "status" = 'accepted' THEN 0 ELSE 1 END,
          "createdAt" DESC,
          "id" DESC
      ) AS rn
    FROM "ConnectionRequest"
  ) ranked
  WHERE rn > 1
);

ALTER TABLE "ConnectionRequest"
  ALTER COLUMN "userLowId" SET NOT NULL,
  ALTER COLUMN "userHighId" SET NOT NULL;

CREATE UNIQUE INDEX "ConnectionRequest_userLowId_userHighId_type_key"
  ON "ConnectionRequest"("userLowId", "userHighId", "type");
CREATE INDEX "ConnectionRequest_senderId_status_idx" ON "ConnectionRequest"("senderId", "status");
CREATE INDEX "ConnectionRequest_recipientId_status_idx" ON "ConnectionRequest"("recipientId", "status");
CREATE INDEX "ConnectionRequest_status_userLowId_idx" ON "ConnectionRequest"("status", "userLowId");
CREATE INDEX "ConnectionRequest_status_userHighId_idx" ON "ConnectionRequest"("status", "userHighId");
