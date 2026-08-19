import { ValidationError } from '../../../shared/domain/result';

/** Canonical ordering prevents duplicate conversations for the same pair. */
export function canonicalParticipantPair(
  userA: string,
  userB: string,
): { participantOneId: string; participantTwoId: string } {
  if (!userA?.trim() || !userB?.trim()) {
    throw new ValidationError('Both participants are required');
  }
  if (userA === userB) {
    throw new ValidationError('You cannot start a conversation with yourself');
  }
  return userA < userB
    ? { participantOneId: userA, participantTwoId: userB }
    : { participantOneId: userB, participantTwoId: userA };
}

export function isConversationParticipant(
  conversation: { participantOneId: string; participantTwoId: string },
  userId: string,
): boolean {
  return (
    conversation.participantOneId === userId ||
    conversation.participantTwoId === userId
  );
}

export function otherParticipantId(
  conversation: { participantOneId: string; participantTwoId: string },
  userId: string,
): string {
  return conversation.participantOneId === userId
    ? conversation.participantTwoId
    : conversation.participantOneId;
}
