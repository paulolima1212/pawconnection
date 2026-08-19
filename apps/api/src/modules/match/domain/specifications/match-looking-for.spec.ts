import {
  AppConnectionIntent,
  AppGender,
  UserEntity,
} from '../../../../shared/domain/types';
import { MatchingLookingForSpec } from './match.spec';

describe('MatchingLookingForSpec', () => {
  const baseUser = (lookingFor: AppConnectionIntent[]): UserEntity =>
    ({
      id: 'u1',
      fullName: 'Test',
      handle: 'test',
      gender: AppGender.Male,
      onboardingComplete: true,
      verified: false,
      interests: [],
      lookingFor,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as UserEntity;

  it('passes when viewer has no looking-for preferences', () => {
    const spec = new MatchingLookingForSpec([]);
    expect(spec.isSatisfiedBy(baseUser([AppConnectionIntent.Friendship]))).toBe(true);
  });

  it('passes when candidate has no looking-for preferences', () => {
    const spec = new MatchingLookingForSpec([AppConnectionIntent.Relationship]);
    expect(spec.isSatisfiedBy(baseUser([]))).toBe(true);
  });

  it('requires overlapping intents when both sides have preferences', () => {
    const spec = new MatchingLookingForSpec([
      AppConnectionIntent.Friendship,
      AppConnectionIntent.MeetPeople,
    ]);
    expect(spec.isSatisfiedBy(baseUser([AppConnectionIntent.Friendship]))).toBe(true);
    expect(spec.isSatisfiedBy(baseUser([AppConnectionIntent.Relationship]))).toBe(false);
  });
});
