import { ValidationError } from '../../../shared/domain/result';
import { MODERATION_EVENTS } from './events/moderation-events';
import { UserBlock } from './user-block.entity';

describe('UserBlock', () => {
  it('creates a block and records UserBlocked', () => {
    const block = UserBlock.create({ blockerId: 'a', blockedId: 'b' });
    expect(block.blockerId).toBe('a');
    expect(block.blockedId).toBe('b');
    expect(block.pullEvents().map((e) => e.eventType)).toEqual([
      MODERATION_EVENTS.USER_BLOCKED,
    ]);
  });

  it('rejects blocking yourself', () => {
    expect(() => UserBlock.create({ blockerId: 'a', blockedId: 'a' })).toThrow(
      ValidationError,
    );
  });
});
