import type { ImageSourcePropType } from 'react-native';

export type InboxSwitchTab = 'connections' | 'requests';

export type InboxRequestFilter = 'all' | 'incoming' | 'outgoing';

export type InboxRequest = {
  id: string;
  dogName: string;
  ownerName: string;
  switchTab: InboxSwitchTab;
  filter: InboxRequestFilter;
  dogAvatar: ImageSourcePropType;
  humanAvatar: ImageSourcePropType;
};

const DOG_AVATAR = require('@/assets/inbox/dog-avatar.png');
const HUMAN_AVATAR = require('@/assets/inbox/human-avatar.png');

export const INBOX_SWITCH_TABS: { id: InboxSwitchTab; label: string }[] = [
  { id: 'connections', label: 'Connections' },
  { id: 'requests', label: 'Requests' },
];

export const INBOX_REQUEST_FILTER_OPTIONS: { value: InboxRequestFilter; label: string }[] = [
  { value: 'all', label: 'All requests' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
];

export const MOCK_INBOX_REQUESTS: InboxRequest[] = [
  {
    id: '1',
    dogName: 'Pluto',
    ownerName: 'Jefferson',
    switchTab: 'connections',
    filter: 'all',
    dogAvatar: DOG_AVATAR,
    humanAvatar: HUMAN_AVATAR,
  },
  {
    id: '2',
    dogName: 'Luna',
    ownerName: 'Sarah',
    switchTab: 'connections',
    filter: 'all',
    dogAvatar: DOG_AVATAR,
    humanAvatar: HUMAN_AVATAR,
  },
  {
    id: '3',
    dogName: 'Max',
    ownerName: 'Daniel',
    switchTab: 'connections',
    filter: 'incoming',
    dogAvatar: DOG_AVATAR,
    humanAvatar: HUMAN_AVATAR,
  },
  {
    id: '3b',
    dogName: 'Cooper',
    ownerName: 'James',
    switchTab: 'connections',
    filter: 'all',
    dogAvatar: DOG_AVATAR,
    humanAvatar: HUMAN_AVATAR,
  },
  {
    id: '3c',
    dogName: 'Milo',
    ownerName: 'Anna',
    switchTab: 'connections',
    filter: 'outgoing',
    dogAvatar: DOG_AVATAR,
    humanAvatar: HUMAN_AVATAR,
  },
  {
    id: '4',
    dogName: 'Bella',
    ownerName: 'Emma',
    switchTab: 'connections',
    filter: 'outgoing',
    dogAvatar: DOG_AVATAR,
    humanAvatar: HUMAN_AVATAR,
  },
  {
    id: '5',
    dogName: 'Rocky',
    ownerName: 'Mike',
    switchTab: 'requests',
    filter: 'outgoing',
    dogAvatar: DOG_AVATAR,
    humanAvatar: HUMAN_AVATAR,
  },
  {
    id: '6',
    dogName: 'Daisy',
    ownerName: 'Olivia',
    switchTab: 'requests',
    filter: 'incoming',
    dogAvatar: DOG_AVATAR,
    humanAvatar: HUMAN_AVATAR,
  },
];

export function filterInboxRequests(
  requests: InboxRequest[],
  switchTab: InboxSwitchTab,
  requestFilter: InboxRequestFilter,
): InboxRequest[] {
  return requests.filter((request) => {
    const tabMatch =
      switchTab === 'requests' ? true : request.switchTab === switchTab;
    const filterMatch =
      requestFilter === 'all' || request.filter === requestFilter || request.filter === 'all';
    return tabMatch && filterMatch;
  });
}
