import { UserBlock } from '../user-block.entity';

export const USER_BLOCK_REPOSITORY = Symbol('USER_BLOCK_REPOSITORY');

export type BlockedUserRow = {
  blockedId: string;
  createdAt: Date;
};

export interface IUserBlockRepository {
  findByPair(blockerId: string, blockedId: string): Promise<UserBlock | null>;
  save(block: UserBlock): Promise<void>;
  delete(blockerId: string, blockedId: string): Promise<boolean>;
  listBlockedBy(blockerId: string): Promise<BlockedUserRow[]>;
}
