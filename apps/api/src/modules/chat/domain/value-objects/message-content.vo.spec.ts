import { MessageContent, sanitizeMessageContent } from './message-content.vo';

describe('MessageContent', () => {
  it('sanitizes HTML and control characters', () => {
    expect(sanitizeMessageContent('<b>hi</b>  ')).toBe('hi');
  });

  it('rejects empty content', () => {
    expect(() => MessageContent.create('   ')).toThrow('Message cannot be empty');
  });

  it('rejects content over max length', () => {
    expect(() => MessageContent.create('a'.repeat(4001))).toThrow('maximum length');
  });

  it('accepts valid text', () => {
    const vo = MessageContent.create('Hello!');
    expect(vo.value).toBe('Hello!');
  });
});
