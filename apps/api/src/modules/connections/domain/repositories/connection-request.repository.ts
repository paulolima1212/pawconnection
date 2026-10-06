import {
  ConnectionRequestEntity,
  ConnectionTypeValue,
  FriendRequestPolicyValue,
  FriendsListVisibilityValue,
  PostVisibilityValue,
  RequestStatusValue,
  UserSummary,
} from '../../../../shared/domain/types';

export type FriendshipPrivacy = {
  friendRequestPolicy: FriendRequestPolicyValue;
  friendsListVisibility: FriendsListVisibilityValue;
  defaultPostVisibility: PostVisibilityValue;
};

export type FriendListQuery = {
  ownerId: string;
  cursor: string | null;
  limit: number;
  q?: string;
};

export type FriendEdge = { senderId: string; recipientId: string };

export type SuggestionProfile = UserSummary & {
  latitude: number | null;
  longitude: number | null;
};

export const CONNECTION_REQUEST_REPOSITORY = Symbol(
  'CONNECTION_REQUEST_REPOSITORY',
);

export interface IConnectionRequestRepository {
  listForUser(userId: string): Promise<ConnectionRequestEntity[]>;
  findById(id: string): Promise<ConnectionRequestEntity | null>;
  findBetween(
    userId: string,
    otherUserId: string,
  ): Promise<ConnectionRequestEntity[]>;
  accept(id: string, userId: string): Promise<ConnectionRequestEntity>;
  reject(id: string, userId: string): Promise<ConnectionRequestEntity>;
  markPending(id: string): Promise<ConnectionRequestEntity>;
  reopenAs(
    id: string,
    senderId: string,
    recipientId: string,
  ): Promise<ConnectionRequestEntity>;
  create(
    senderId: string,
    recipientId: string,
    type: ConnectionTypeValue,
  ): Promise<ConnectionRequestEntity>;
  transition(
    id: string,
    from: RequestStatusValue,
    to: RequestStatusValue,
  ): Promise<ConnectionRequestEntity | null>;
  listAcceptedFriendIds(userId: string): Promise<string[]>;
  listAcceptedEdges(userIds: string[]): Promise<FriendEdge[]>;
  listFriendsPage(query: FriendListQuery): Promise<{
    rows: ConnectionRequestEntity[];
    hasMore: boolean;
  }>;
  listProfiles(userIds: string[]): Promise<SuggestionProfile[]>;
  listRequestPolicies(
    userIds: string[],
  ): Promise<{ id: string; friendRequestPolicy: FriendRequestPolicyValue }[]>;
  getPrivacy(userId: string): Promise<FriendshipPrivacy | null>;
  updatePrivacy(
    userId: string,
    patch: Partial<FriendshipPrivacy>,
  ): Promise<FriendshipPrivacy>;
  deactivateBetween(userId: string, otherUserId: string): Promise<number>;
}
