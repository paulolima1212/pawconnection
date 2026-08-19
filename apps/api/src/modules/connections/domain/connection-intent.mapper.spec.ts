import { AppConnectionIntent } from '../../../shared/domain/types';
import { connectionTypeFromLookingFor } from './connection-intent.mapper';

describe('connectionTypeFromLookingFor', () => {
  it('maps all intents to friendship (no romance)', () => {
    expect(connectionTypeFromLookingFor(AppConnectionIntent.Relationship)).toBe(
      'friendship',
    );
    expect(connectionTypeFromLookingFor(AppConnectionIntent.CasualDating)).toBe(
      'friendship',
    );
    expect(connectionTypeFromLookingFor(AppConnectionIntent.Friendship)).toBe(
      'friendship',
    );
    expect(connectionTypeFromLookingFor(AppConnectionIntent.MeetPeople)).toBe(
      'friendship',
    );
  });
});
