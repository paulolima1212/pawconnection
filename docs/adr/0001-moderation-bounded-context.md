# 0001. Moderation bounded context for reports and blocks

Date: 2026-09-01
Status: Accepted

## Context
Users need to flag unsafe publications and cut off another person entirely. Blocking already existed as a chat-only persistence model (`UserBlock`) that only stopped messaging. Reports had no aggregate or API.

Other contexts (feed, match, map, connections, profile, comments, chat) must hide blocked people and refuse interaction without calling each other's repositories.

## Decision
Introduce a `moderation` bounded context that owns:

- **Post report** aggregate — a viewer files one report per publication, with a reason and optional details.
- **User block** aggregate — a blocker hides a blocked user in both directions.

Other modules depend on the `USER_BLOCK_READER` port (`isBlockedBetween`, `listHiddenUserIds`) exported by `ModerationModule`. Chat keeps its own `CHAT_BLOCK_READER` port, bound to the same implementation.

HTTP:

- `POST /feed/posts/:postId/report`
- `POST /users/:userId/block` and `DELETE /users/:userId/block` (moved out of chat)
- `GET /blocks`

Domain events: `moderation.post_reported`, `moderation.user_blocked`, `moderation.user_unblocked`.

## Consequences
Positive: one place for safety rules; feed, map, match, inbox, profile, comments, and chat all honor the same block graph.

Negative: listing still filters in memory after load in some use cases (same pattern as existing feed filters). A later pass can push `notIn: hiddenIds` into Prisma queries.

Follow-up: moderator review queue for `PostReport.status`, reporting comments/users, and a settings screen to manage the block list.
