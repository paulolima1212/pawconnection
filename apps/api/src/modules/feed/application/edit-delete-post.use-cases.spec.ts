import { ForbiddenError, NotFoundError } from '../../../shared/domain/result';
import { PostEntity } from '../../../shared/domain/types';
import { FeedPostSnapshot } from '../domain/feed-post';
import { IPostRepository } from '../domain/repositories/post.repository';
import { DeleteFeedPostUseCase, UpdateFeedPostUseCase } from './feed.use-cases';

class InMemoryPosts implements Pick<
  IPostRepository,
  'findSnapshot' | 'updatePost' | 'deletePost'
> {
  snapshot: FeedPostSnapshot | null = {
    id: 'post-1',
    authorId: 'author',
    body: 'Original',
    imageUrls: ['https://cdn.example/a.jpg'],
    visibility: 'public',
  };
  deleted = false;
  saved: FeedPostSnapshot | null = null;

  findSnapshot() {
    return Promise.resolve(this.snapshot);
  }

  updatePost(next: FeedPostSnapshot): Promise<PostEntity> {
    this.saved = next;
    this.snapshot = next;
    return Promise.resolve({
      id: next.id,
      authorId: next.authorId,
      body: next.body,
      visibility: next.visibility,
      imageUrls: next.imageUrls,
      likeCount: 2,
      commentCount: 1,
      likedByMe: false,
      createdAt: new Date('2026-10-01T00:00:00Z'),
      updatedAt: new Date('2026-10-26T00:00:00Z'),
    });
  }

  deletePost() {
    this.deleted = true;
    this.snapshot = null;
    return Promise.resolve();
  }
}

describe('UpdateFeedPostUseCase', () => {
  it('Given the author, When they edit, Then the saved post is returned', async () => {
    const posts = new InMemoryPosts();
    const useCase = new UpdateFeedPostUseCase(
      posts as unknown as IPostRepository,
    );

    const updated = await useCase.execute('post-1', 'author', {
      body: 'Edited',
      imageUrls: ['https://cdn.example/b.jpg'],
      visibility: 'private',
    });

    expect(posts.saved?.body).toBe('Edited');
    expect(posts.saved?.visibility).toBe('private');
    expect(updated.body).toBe('Edited');
    expect(updated.imageUrls).toEqual(['https://cdn.example/b.jpg']);
  });

  it('Given a missing post, When someone edits, Then it is not found', async () => {
    const posts = new InMemoryPosts();
    posts.snapshot = null;
    const useCase = new UpdateFeedPostUseCase(
      posts as unknown as IPostRepository,
    );

    await expect(
      useCase.execute('missing', 'author', { body: 'x', imageUrls: [] }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('Given another user, When they edit, Then nothing is saved', async () => {
    const posts = new InMemoryPosts();
    const useCase = new UpdateFeedPostUseCase(
      posts as unknown as IPostRepository,
    );

    await expect(
      useCase.execute('post-1', 'other', { body: 'hack', imageUrls: [] }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(posts.saved).toBeNull();
  });
});

describe('DeleteFeedPostUseCase', () => {
  it('Given the author, When they delete, Then the post is removed', async () => {
    const posts = new InMemoryPosts();
    const useCase = new DeleteFeedPostUseCase(
      posts as unknown as IPostRepository,
    );

    await expect(useCase.execute('post-1', 'author')).resolves.toEqual({
      id: 'post-1',
    });
    expect(posts.deleted).toBe(true);
  });

  it('Given another user, When they delete, Then the post stays', async () => {
    const posts = new InMemoryPosts();
    const useCase = new DeleteFeedPostUseCase(
      posts as unknown as IPostRepository,
    );

    await expect(useCase.execute('post-1', 'other')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(posts.deleted).toBe(false);
  });

  it('Given a missing post, When the author deletes, Then it is not found', async () => {
    const posts = new InMemoryPosts();
    posts.snapshot = null;
    const useCase = new DeleteFeedPostUseCase(
      posts as unknown as IPostRepository,
    );

    await expect(useCase.execute('missing', 'author')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
