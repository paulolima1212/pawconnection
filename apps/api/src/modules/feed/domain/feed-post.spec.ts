import { ForbiddenError, ValidationError } from '../../../shared/domain/result';
import { FeedPost } from './feed-post';

const snapshot = {
  id: 'post-1',
  authorId: 'author',
  body: 'Walk in the park',
  imageUrls: ['https://cdn.example/a.jpg'],
  visibility: 'public' as const,
};

describe('FeedPost', () => {
  describe('edit', () => {
    it('Given the author, When they change the text, Then the post keeps the new text', () => {
      const next = FeedPost.restore(snapshot).edit('author', {
        body: '  Updated story  ',
        imageUrls: snapshot.imageUrls,
      });

      expect(next).toEqual({
        ...snapshot,
        body: 'Updated story',
      });
    });

    it('Given another user, When they try to edit, Then the change is rejected', () => {
      expect(() =>
        FeedPost.restore(snapshot).edit('someone-else', {
          body: 'nope',
          imageUrls: snapshot.imageUrls,
        }),
      ).toThrow(ForbiddenError);
    });

    it('Given an edit that removes text and photos, When saved, Then it is rejected', () => {
      expect(() =>
        FeedPost.restore(snapshot).edit('author', {
          body: '   ',
          imageUrls: [],
        }),
      ).toThrow(ValidationError);
    });

    it('Given more than 8 photos, When the author edits, Then it is rejected', () => {
      expect(() =>
        FeedPost.restore(snapshot).edit('author', {
          body: 'photos',
          imageUrls: Array.from(
            { length: 9 },
            (_, i) => `https://cdn.example/${i}.jpg`,
          ),
        }),
      ).toThrow(ValidationError);
    });

    it('Given a new visibility, When the author edits, Then the audience changes', () => {
      const next = FeedPost.restore(snapshot).edit('author', {
        body: snapshot.body,
        imageUrls: [],
        visibility: 'friends',
      });

      expect(next.visibility).toBe('friends');
      expect(next.imageUrls).toEqual([]);
    });
  });

  describe('delete', () => {
    it('Given the author, When they delete, Then the post may be removed', () => {
      expect(() =>
        FeedPost.restore(snapshot).assertDeletableBy('author'),
      ).not.toThrow();
    });

    it('Given another user, When they try to delete, Then the removal is rejected', () => {
      expect(() =>
        FeedPost.restore(snapshot).assertDeletableBy('someone-else'),
      ).toThrow(ForbiddenError);
    });
  });
});
