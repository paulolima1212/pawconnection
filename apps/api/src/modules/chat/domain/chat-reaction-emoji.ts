/** Validates a single system emoji (including ZWJ sequences), not arbitrary text. */
export function isValidReactionEmoji(value: string): boolean {
  const emoji = value.trim();
  if (!emoji || emoji.length > 32) return false;

  const emojiPattern =
    /^(?:\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?)*)$/u;

  return emojiPattern.test(emoji);
}
