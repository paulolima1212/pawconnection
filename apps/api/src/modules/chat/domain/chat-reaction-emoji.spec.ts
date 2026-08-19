import { isValidReactionEmoji } from './chat-reaction-emoji';

describe('isValidReactionEmoji', () => {
  it('accepts common system emojis', () => {
    expect(isValidReactionEmoji('❤️')).toBe(true);
    expect(isValidReactionEmoji('👍')).toBe(true);
    expect(isValidReactionEmoji('😂')).toBe(true);
    expect(isValidReactionEmoji('🐶')).toBe(true);
  });

  it('rejects plain text and mixed content', () => {
    expect(isValidReactionEmoji('hello')).toBe(false);
    expect(isValidReactionEmoji('👍 ok')).toBe(false);
    expect(isValidReactionEmoji('')).toBe(false);
  });
});
