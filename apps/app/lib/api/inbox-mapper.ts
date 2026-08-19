import type { ImageSourcePropType } from 'react-native';

import type { InboxRequest, InboxRequestFilter, InboxSwitchTab } from '@/constants/inbox-mocks';
import { resolveMediaUrl } from '@/lib/api/media';
import type { InboxRequestApi } from '@/lib/api/types';

const DOG_FALLBACK = require('@/assets/inbox/dog-avatar.png');
const HUMAN_FALLBACK = require('@/assets/inbox/human-avatar.png');

function avatarSource(uri?: string | null): ImageSourcePropType {
  const resolved = resolveMediaUrl(uri);
  return resolved ? { uri: resolved } : DOG_FALLBACK;
}

export function mapInboxRequestFromApi(
  item: InboxRequestApi,
  currentUserId: string,
): InboxRequest {
  const isIncoming = item.recipientId === currentUserId;
  const peer = isIncoming ? item.sender : item.recipient;
  const ownerName = peer?.fullName ?? 'Unknown';
  const dogName = peer?.petName ?? 'Dog';

  // Legacy romance rows surface under Connections (no romance tab).
  const switchTab: InboxSwitchTab =
    item.type === 'request' ? 'requests' : 'connections';

  return {
    id: item.id,
    dogName,
    ownerName,
    switchTab,
    filter: isIncoming ? 'incoming' : 'outgoing',
    dogAvatar: avatarSource(peer?.petPhotoUrl),
    humanAvatar: avatarSource(peer?.photoUrl) ?? HUMAN_FALLBACK,
  };
}

export function inboxQueryParams(
  switchTab: InboxSwitchTab,
  requestFilter: InboxRequestFilter,
): { type?: 'romance' | 'friendship' | 'request'; direction?: 'incoming' | 'outgoing' } {
  const params: {
    type?: 'romance' | 'friendship' | 'request';
    direction?: 'incoming' | 'outgoing';
  } = {};

  // Connections: omit type so friendship + legacy romance rows come back; UI maps both to Connections.
  if (switchTab === 'requests') {
    params.type = 'request';
  }

  if (requestFilter === 'incoming' || requestFilter === 'outgoing') {
    params.direction = requestFilter;
  }

  return params;
}
