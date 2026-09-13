import { UserEntity } from '../../../../shared/domain/types';
import { ExcludePassedUsersSpec } from './match';

describe('ExcludePassedUsersSpec', () => {
  it('is satisfied when the candidate was not passed', () => {
    expect(
      new ExcludePassedUsersSpec(new Set(['other'])).isSatisfiedBy({
        id: 'me',
      } as UserEntity),
    ).toBe(true);
  });
});
