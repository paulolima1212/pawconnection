import { ConnectionRequestEntity } from '../../../../shared/domain/types';
import { PendingRequestsSpec } from './connection-request';

describe('PendingRequestsSpec', () => {
  it('is satisfied for pending requests', () => {
    expect(
      new PendingRequestsSpec().isSatisfiedBy({
        status: 'pending',
      } as ConnectionRequestEntity),
    ).toBe(true);
  });
});
