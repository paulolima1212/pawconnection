import { Injectable } from '@nestjs/common';
import { IModerationPolicy } from '../domain/ports/moderation-policy.port';

/**
 * Default policy: no privileged moderators (the User model carries no role yet).
 * This is the single seam to extend for real moderation — e.g. read a `role`
 * column, consult an RBAC service, or check a moderators table — without
 * touching any use case.
 */
@Injectable()
export class DefaultModerationPolicy implements IModerationPolicy {
  async isModerator(_userId: string): Promise<boolean> {
    return false;
  }
}
