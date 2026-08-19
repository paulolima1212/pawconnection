import { Inject, Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../shared/domain/result';
import { CHAT_BLOCK_READER, IChatBlockReader } from '../domain/ports/block-reader.port';
import { IChatPolicy } from '../domain/ports/chat-policy.port';
import { CHAT_USER_READER, IChatUserReader } from '../domain/ports/user-reader.port';

@Injectable()
export class DefaultChatPolicy implements IChatPolicy {
  constructor(
    @Inject(CHAT_USER_READER) private readonly users: IChatUserReader,
    @Inject(CHAT_BLOCK_READER) private readonly blocks: IChatBlockReader,
  ) {}

  async canUsersCommunicate(senderId: string, recipientId: string): Promise<void> {
    if (senderId === recipientId) {
      throw new ValidationError('You cannot start a conversation with yourself');
    }

    const [sender, recipient, blocked] = await Promise.all([
      this.users.findById(senderId),
      this.users.findById(recipientId),
      this.blocks.isBlockedBetween(senderId, recipientId),
    ]);
    if (!sender) throw new NotFoundError('Sender not found');
    if (!recipient) throw new NotFoundError('Recipient not found');
    if (blocked) {
      throw new ForbiddenError('Messaging is not allowed with this user');
    }
    if (!recipient.onboardingComplete) {
      throw new ForbiddenError('Cannot message users who have not completed onboarding');
    }
  }
}
