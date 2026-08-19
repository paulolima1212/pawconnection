import {
  AppConnectionIntent,
  ConnectionTypeValue,
} from '../../../shared/domain/types';

/**
 * Maps connection intent to inbox connection type.
 * Romance intents are treated as friendship — Paw Connection is for dog owners, not dating.
 */
export function connectionTypeFromLookingFor(
  lookingFor: AppConnectionIntent,
): ConnectionTypeValue {
  switch (lookingFor) {
    case AppConnectionIntent.Relationship:
    case AppConnectionIntent.CasualDating:
    case AppConnectionIntent.Friendship:
    case AppConnectionIntent.MeetPeople:
    default:
      return 'friendship';
  }
}
