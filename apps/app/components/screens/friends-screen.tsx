import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { useAuth } from '@/context/auth';
import { CONNECTION_INTENT_FRIENDSHIP } from '@/context/profile-onboarding';
import { useKeyboardAwareBottomPadding } from '@/components/paw/keyboard-aware-form-scroll';
import * as inboxApi from '@/lib/api/inbox';
import type {
  FriendCardApi,
  FriendSuggestionApi,
  FriendshipPrivacyApi,
  InboxRequestApi,
} from '@/lib/api/inbox';
import {
  FRIENDSHIP_EMPTY,
  FRIENDSHIP_ERRORS,
  friendSubtitle,
  mutualFriendsLabel,
} from '@/lib/friendship-copy';

type FriendsTab = 'friends' | 'requests' | 'suggestions';

const PRIVACY_REQUEST = ['everyone', 'friends_of_friends', 'nobody'] as const;
const PRIVACY_LIST = ['everyone', 'friends', 'only_me'] as const;
const PRIVACY_POST = ['public', 'friends', 'private'] as const;

export function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useAuth();
  const bottomPad = useKeyboardAwareBottomPadding(32);
  const [tab, setTab] = useState<FriendsTab>('friends');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [friends, setFriends] = useState<FriendCardApi[]>([]);
  const [requests, setRequests] = useState<InboxRequestApi[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestionApi[]>([]);
  const [privacy, setPrivacy] = useState<FriendshipPrivacyApi | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(
    async (mode: 'replace' | 'more' | 'refresh', pageCursor?: string | null) => {
      if (mode === 'refresh') setRefreshing(true);
      else if (mode === 'replace') setLoading(true);
      setError(null);
      try {
        if (tab === 'friends') {
          const page = await inboxApi.listFriends({
            q: debouncedQuery || undefined,
            cursor: mode === 'more' ? pageCursor : null,
          });
          setFriends((current) => (mode === 'more' ? [...current, ...page.items] : page.items));
          setCursor(page.nextCursor);
          setHasMore(page.hasMore);
          if (!privacy) setPrivacy(await inboxApi.getFriendshipPrivacy());
        } else if (tab === 'requests') {
          const rows = await inboxApi.listInboxRequests({ type: 'friendship' });
          setRequests(rows.filter((row) => row.status === 'pending'));
        } else {
          setSuggestions(await inboxApi.listFriendSuggestions());
        }
      } catch {
        setError(FRIENDSHIP_ERRORS[tab]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab, debouncedQuery, privacy],
  );

  useEffect(() => {
    void load('replace');
    // Reload when the section or the debounced search changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debouncedQuery]);

  const person = (request: InboxRequestApi) =>
    request.senderId === userId ? request.recipient : request.sender;

  const onAccept = async (id: string) => {
    setBusyId(id);
    try {
      await inboxApi.acceptInboxRequest(id);
      setRequests((current) => current.filter((row) => row.id !== id));
    } catch {
      setError(FRIENDSHIP_ERRORS.requests);
    } finally {
      setBusyId(null);
    }
  };

  const onDecline = async (id: string) => {
    setBusyId(id);
    try {
      await inboxApi.rejectInboxRequest(id);
      setRequests((current) => current.filter((row) => row.id !== id));
    } catch {
      setError(FRIENDSHIP_ERRORS.requests);
    } finally {
      setBusyId(null);
    }
  };

  const onCancel = async (id: string) => {
    setBusyId(id);
    try {
      await inboxApi.cancelInboxRequest(id);
      setRequests((current) => current.filter((row) => row.id !== id));
    } catch {
      setError(FRIENDSHIP_ERRORS.requests);
    } finally {
      setBusyId(null);
    }
  };

  const onAddSuggestion = async (suggestion: FriendSuggestionApi) => {
    setBusyId(suggestion.user.id);
    try {
      await inboxApi.createConnectionRequest(suggestion.user.id, CONNECTION_INTENT_FRIENDSHIP);
      setSuggestions((current) => current.filter((row) => row.user.id !== suggestion.user.id));
    } catch {
      setError(FRIENDSHIP_ERRORS.suggestions);
    } finally {
      setBusyId(null);
    }
  };

  const cyclePrivacy = async (
    field: keyof FriendshipPrivacyApi,
    options: readonly string[],
  ) => {
    if (!privacy) return;
    const current = privacy[field];
    const next = options[(options.indexOf(current) + 1) % options.length];
    const previous = privacy;
    const optimistic = { ...privacy, [field]: next };
    setPrivacy(optimistic);
    try {
      setPrivacy(await inboxApi.updateFriendshipPrivacy({ [field]: next }));
    } catch {
      setPrivacy(previous);
      setError(FRIENDSHIP_ERRORS.friends);
    }
  };

  const received = requests.filter((row) => row.recipientId === userId);
  const sent = requests.filter((row) => row.senderId === userId);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Text style={styles.headerBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Friends
        </Text>
        <View style={styles.headerBtn} />
      </View>
      <View style={styles.tabs}>
        {(['friends', 'requests', 'suggestions'] as const).map((item) => (
          <Pressable
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tab, tab === item && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item }}
            accessibilityLabel={item}>
            <Text style={styles.tabText}>
              {item === 'friends' ? 'Friends' : item === 'requests' ? 'Requests' : 'Suggestions'}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad, paddingHorizontal: PawLayout.horizontalPadding }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} />
        }
        keyboardShouldPersistTaps="handled">
        {tab === 'friends' ? (
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, dog, or breed"
            style={styles.search}
            accessibilityLabel="Search friends"
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={PawColors.peachBorder} style={styles.gap} />
        ) : error ? (
          <View style={styles.gap}>
            <Text style={styles.body}>{error}</Text>
            <Pressable
              onPress={() => void load('replace')}
              style={styles.action}
              accessibilityRole="button"
              accessibilityLabel="Try again">
              <Text style={styles.actionText}>Try again</Text>
            </Pressable>
          </View>
        ) : tab === 'friends' ? (
          friends.length === 0 ? (
            <Text style={styles.body}>{FRIENDSHIP_EMPTY.friends}</Text>
          ) : (
            friends.map((friend) => (
              <Pressable
                key={friend.id}
                onPress={() => router.push(`/user/${friend.user.handle}`)}
                style={styles.card}
                accessibilityRole="button"
                accessibilityLabel={`${friend.user.fullName}, ${friendSubtitle(friend.user.petName, friend.user.petBreed)}`}>
                <View style={styles.person}>
                  <RemoteMediaImage
                    uri={friend.user.petPhotoUrl ?? friend.user.photoUrl}
                    style={styles.avatar}
                  />
                  <View style={styles.personText}>
                    <Text style={styles.name}>{friend.user.fullName}</Text>
                    <Text style={styles.body}>
                      {friendSubtitle(friend.user.petName, friend.user.petBreed)}
                    </Text>
                    <Text style={styles.body}>{mutualFriendsLabel(friend.mutualFriendCount)}</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )
        ) : tab === 'requests' ? (
          received.length + sent.length === 0 ? (
            <Text style={styles.body}>{FRIENDSHIP_EMPTY.requests}</Text>
          ) : (
            <View style={styles.gap}>
              <Text style={styles.name}>Received</Text>
              {received.map((request) => {
                const other = person(request);
                return (
                  <View key={request.id} style={styles.card}>
                    <View style={styles.person}>
                      <RemoteMediaImage
                        uri={other?.petPhotoUrl ?? other?.photoUrl}
                        style={styles.avatar}
                      />
                      <View style={styles.personText}>
                        <Text style={styles.name}>{other?.fullName ?? 'Someone'}</Text>
                        <Text style={styles.body}>
                          {other?.fullName ?? 'Someone'} sent you a friend request.
                        </Text>
                        <Text style={styles.body}>{friendSubtitle(other?.petName, other?.petBreed)}</Text>
                      </View>
                    </View>
                    <View style={styles.row}>
                      <Pressable
                        onPress={() => void onAccept(request.id)}
                        disabled={busyId === request.id}
                        style={styles.action}
                        accessibilityRole="button"
                        accessibilityLabel={`Accept ${other?.fullName ?? 'friend request'}`}>
                        <Text style={styles.actionText}>Accept</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => void onDecline(request.id)}
                        disabled={busyId === request.id}
                        style={styles.action}
                        accessibilityRole="button"
                        accessibilityLabel={`Decline ${other?.fullName ?? 'friend request'}`}>
                        <Text style={styles.actionText}>Decline</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
              <Text style={styles.name}>Sent</Text>
              {sent.map((request) => {
                const other = person(request);
                return (
                  <View key={request.id} style={styles.card}>
                    <View style={styles.person}>
                      <RemoteMediaImage
                        uri={other?.petPhotoUrl ?? other?.photoUrl}
                        style={styles.avatar}
                      />
                      <View style={styles.personText}>
                        <Text style={styles.name}>{other?.fullName ?? 'Someone'}</Text>
                        <Text style={styles.body}>{friendSubtitle(other?.petName, other?.petBreed)}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => void onCancel(request.id)}
                      disabled={busyId === request.id}
                      style={styles.action}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel request">
                      <Text style={styles.actionText}>Cancel Request</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )
        ) : suggestions.length === 0 ? (
          <Text style={styles.body}>{FRIENDSHIP_EMPTY.suggestions}</Text>
        ) : (
          suggestions.map((suggestion) => (
            <View key={suggestion.user.id} style={styles.card}>
              <View style={styles.person}>
                <RemoteMediaImage
                  uri={suggestion.user.petPhotoUrl ?? suggestion.user.photoUrl}
                  style={styles.avatar}
                />
                <View style={styles.personText}>
                  <Text style={styles.name}>{suggestion.user.fullName}</Text>
                  <Text style={styles.body}>
                    {friendSubtitle(suggestion.user.petName, suggestion.user.petBreed)}
                  </Text>
                  <Text style={styles.body}>{mutualFriendsLabel(suggestion.mutualFriendCount)}</Text>
                </View>
              </View>
              {suggestion.livesNearby ? <Text style={styles.body}>Lives nearby</Text> : null}
              <Pressable
                onPress={() => void onAddSuggestion(suggestion)}
                disabled={busyId === suggestion.user.id}
                style={styles.action}
                accessibilityRole="button"
                accessibilityLabel={`Add ${suggestion.user.fullName} as a friend`}>
                <Text style={styles.actionText}>Add Friend</Text>
              </Pressable>
            </View>
          ))
        )}
        {tab === 'friends' && hasMore ? (
          <Pressable
            onPress={() => void load('more', cursor)}
            style={styles.action}
            accessibilityRole="button"
            accessibilityLabel="Load more friends">
            <Text style={styles.actionText}>Load more</Text>
          </Pressable>
        ) : null}
        {tab === 'friends' && privacy ? (
          <View style={styles.gap}>
            <Text style={styles.name}>Privacy</Text>
            <Pressable
              onPress={() => void cyclePrivacy('friendRequestPolicy', PRIVACY_REQUEST)}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`Who can send friend requests, currently ${privacy.friendRequestPolicy}`}>
              <Text style={styles.body}>Who can send me friend requests?</Text>
              <Text style={styles.name}>{privacy.friendRequestPolicy}</Text>
            </Pressable>
            <Pressable
              onPress={() => void cyclePrivacy('friendsListVisibility', PRIVACY_LIST)}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`Who can see my friends list, currently ${privacy.friendsListVisibility}`}>
              <Text style={styles.body}>Who can see my friends list?</Text>
              <Text style={styles.name}>{privacy.friendsListVisibility}</Text>
            </Pressable>
            <Pressable
              onPress={() => void cyclePrivacy('defaultPostVisibility', PRIVACY_POST)}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`Default post visibility, currently ${privacy.defaultPostVisibility}`}>
              <Text style={styles.body}>Default post visibility</Text>
              <Text style={styles.name}>{privacy.defaultPostVisibility}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PawColors.creamBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PawLayout.horizontalPadding,
    minHeight: 48,
  },
  headerBtn: { minWidth: 64, minHeight: 44, justifyContent: 'center' },
  headerBtnText: { fontSize: PawFontSize.body, color: PawColors.black },
  title: { fontSize: PawFontSize.body, fontWeight: '700', color: PawColors.black },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: PawLayout.horizontalPadding, paddingBottom: 8 },
  tab: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  tabOn: { borderBottomWidth: 2, borderColor: PawColors.black },
  tabText: { fontSize: PawFontSize.caption, fontWeight: '700', color: PawColors.black },
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: PawColors.black,
  },
  card: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: PawColors.black, gap: 4 },
  person: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  personText: { flex: 1, gap: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: PawColors.fieldGray },
  name: { fontSize: PawFontSize.body, fontWeight: '700', color: PawColors.black },
  body: { fontSize: PawFontSize.caption, color: PawColors.black },
  row: { flexDirection: 'row', gap: 8 },
  action: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionText: { fontSize: PawFontSize.caption, fontWeight: '700', color: PawColors.black },
  gap: { gap: 8, marginTop: 12 },
});
