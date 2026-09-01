import {
  PartiesNotBlockedSpec,
  VisibleAuthorSpec,
  VisibleToViewerSpec,
} from './hidden-user';

describe('VisibleToViewerSpec', () => {
  it('hides blocked user ids from the viewer', () => {
    const spec = new VisibleToViewerSpec(new Set(['blocked-1']));
    expect(spec.isSatisfiedBy({ id: 'visible-1' })).toBe(true);
    expect(spec.isSatisfiedBy({ id: 'blocked-1' })).toBe(false);
  });
});

describe('VisibleAuthorSpec', () => {
  it('hides content authored by blocked users', () => {
    const spec = new VisibleAuthorSpec(new Set(['blocked-1']));
    expect(spec.isSatisfiedBy({ authorId: 'me' })).toBe(true);
    expect(spec.isSatisfiedBy({ authorId: 'blocked-1' })).toBe(false);
  });
});

describe('PartiesNotBlockedSpec', () => {
  it('rejects requests involving a hidden user', () => {
    const spec = new PartiesNotBlockedSpec(new Set(['blocked-1']));
    expect(
      spec.isSatisfiedBy({ senderId: 'me', recipientId: 'friend' }),
    ).toBe(true);
    expect(
      spec.isSatisfiedBy({ senderId: 'blocked-1', recipientId: 'me' }),
    ).toBe(false);
    expect(
      spec.isSatisfiedBy({ senderId: 'me', recipientId: 'blocked-1' }),
    ).toBe(false);
  });
});
