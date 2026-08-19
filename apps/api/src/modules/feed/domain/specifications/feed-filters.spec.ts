import { AppGender } from '../../../../shared/domain/types';
import {
  FeedPostWithAuthorMeta,
  postAuthorMatchesCity,
  postMatchesFeedFilters,
} from './feed-domain';

describe('postAuthorMatchesCity', () => {
  it('passes when city filter is empty', () => {
    expect(postAuthorMatchesCity('Austin, TX', '')).toBe(true);
  });

  it('fails when author has no location but city filter is set', () => {
    expect(postAuthorMatchesCity(null, 'Austin')).toBe(false);
    expect(postAuthorMatchesCity(undefined, 'Austin')).toBe(false);
  });

  it('matches substring in either direction', () => {
    expect(postAuthorMatchesCity('Austin, TX', 'austin')).toBe(true);
    expect(postAuthorMatchesCity('TX', 'Austin, TX')).toBe(true);
  });

  it('rejects unrelated locations', () => {
    expect(postAuthorMatchesCity('Austin, TX', 'Mosman')).toBe(false);
  });
});

describe('postMatchesFeedFilters', () => {
  const basePost: FeedPostWithAuthorMeta = {
    id: '1',
    authorId: 'u1',
    body: 'Park day with Luna',
    imageUrls: [],
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: 'u1',
      fullName: 'Sarah',
      handle: 'sarah',
      location: 'Austin, TX',
      petName: 'Luna',
      petAge: 3,
      petGender: AppGender.Female,
      petBreed: 'Husky',
    },
  };

  it('passes with no filters', () => {
    expect(postMatchesFeedFilters(basePost, {})).toBe(true);
  });

  it('filters by author name', () => {
    expect(postMatchesFeedFilters(basePost, { author: 'sarah' })).toBe(true);
    expect(postMatchesFeedFilters(basePost, { author: 'neo' })).toBe(false);
  });

  it('filters by pet gender and age', () => {
    expect(postMatchesFeedFilters(basePost, { petGender: 'Female', petAge: 3 })).toBe(true);
    expect(postMatchesFeedFilters(basePost, { petGender: 'Male' })).toBe(false);
    expect(postMatchesFeedFilters(basePost, { petAge: 5 })).toBe(false);
  });

  it('filters by pet size via breed', () => {
    expect(postMatchesFeedFilters(basePost, { petSize: 'large' })).toBe(true);
    expect(postMatchesFeedFilters(basePost, { petSize: 'small' })).toBe(false);
  });
});
