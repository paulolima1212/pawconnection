import { ConnectionRequestEntity, ConnectionTypeValue } from '../../../../shared/domain/types';

export const CONNECTION_REQUEST_REPOSITORY = Symbol('CONNECTION_REQUEST_REPOSITORY');

export interface IConnectionRequestRepository {
  listForUser(userId: string): Promise<ConnectionRequestEntity[]>;
  findById(id: string): Promise<ConnectionRequestEntity | null>;
  accept(id: string, userId: string): Promise<ConnectionRequestEntity>;
  reject(id: string, userId: string): Promise<ConnectionRequestEntity>;
  create(
    senderId: string,
    recipientId: string,
    type: ConnectionTypeValue,
  ): Promise<ConnectionRequestEntity>;
}
