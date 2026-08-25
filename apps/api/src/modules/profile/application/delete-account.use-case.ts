import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotFoundError } from '../../../shared/domain/result';
import { EVENT_BUS, IEventBus } from '../../../shared/events/event-bus';
import { AccountDeletedEvent } from '../domain/events/profile-events';
import {
  ACCOUNT_MEDIA_CLEANER,
  IAccountMediaCleaner,
} from '../domain/ports/account-media-cleaner.port';
import { collectProfileMediaUrls } from '../domain/profile-media-urls';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../domain/repositories/user.repository';

@Injectable()
export class DeleteAccountUseCase {
  private readonly logger = new Logger(DeleteAccountUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(ACCOUNT_MEDIA_CLEANER) private readonly media: IAccountMediaCleaner,
    @Inject(EVENT_BUS) private readonly bus: IEventBus,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const mediaUrls = collectProfileMediaUrls(user);
    await this.users.deleteById(userId);

    try {
      await this.media.removeObjectUrls(mediaUrls);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Account ${userId} deleted but media cleanup failed: ${message}`,
      );
    }

    await this.bus.publish(
      new AccountDeletedEvent({
        userId,
        handle: user.handle,
        mediaUrlCount: mediaUrls.length,
      }),
    );
  }
}
