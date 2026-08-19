import { CommentContent } from './comment-content.vo';

describe('CommentContent', () => {
  it('accepts and trims normal text', () => {
    const c = CommentContent.create('  Hello there  ');
    expect(c.value).toBe('Hello there');
  });

  it('rejects empty / whitespace-only content', () => {
    expect(() => CommentContent.create('   ')).toThrow(/empty/i);
    expect(() => CommentContent.create('')).toThrow();
  });

  it('rejects content exceeding the max length', () => {
    const tooLong = 'a'.repeat(CommentContent.MAX_LENGTH + 1);
    expect(() => CommentContent.create(tooLong)).toThrow(/exceed/i);
  });

  it('strips HTML tags to neutralize stored XSS', () => {
    const c = CommentContent.create('<script>alert(1)</script>hello');
    expect(c.value).toBe('alert(1)hello');
    expect(c.value).not.toMatch(/</);
  });

  it('removes a complete tag wrapper but keeps inner text', () => {
    const c = CommentContent.create('<b>bold</b> move');
    expect(c.value).toBe('bold move');
  });

  it('collapses excessive whitespace', () => {
    const c = CommentContent.create('a      b');
    expect(c.value).toBe('a b');
  });

  it('supports value equality', () => {
    expect(CommentContent.create('hi').equals(CommentContent.create('hi'))).toBe(true);
    expect(CommentContent.create('hi').equals(CommentContent.create('bye'))).toBe(
      false,
    );
  });
});
