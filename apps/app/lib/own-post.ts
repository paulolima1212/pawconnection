export function isOwnPost(
  post: { authorId?: string | null; author?: { id?: string | null } | null },
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  return post.authorId === userId || post.author?.id === userId;
}
