import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipOptionDropdown } from '@/components/paw/chip-option-dropdown';
import { FeedPostAvatar } from '@/components/paw/feed-post-avatar';
import { FeedPostImages } from '@/components/paw/feed-post-images';
import { FeedCityAreaChip } from '@/components/paw/feed-city-area-chip';
import { FeedDiscoveryMap } from '@/components/paw/feed-discovery-map';
import { FeedMapToggle, type FeedMapMode } from '@/components/paw/feed-map-toggle';
import { PawLogo } from '@/components/paw/paw-logo';
import {
  FEED_POST_SCOPE_OPTIONS,
  FEED_RADIUS_OPTIONS,
  type FeedPostScope,
  type FeedRadiusKm,
} from '@/constants/feed-discovery-filters';
import {
  buildListFeedPostsParams,
  countActiveFeedSearchFilters,
  EMPTY_FEED_SEARCH_FILTERS,
  type FeedSearchFilters,
} from '@/constants/feed-search-filters';
import { FeedSearchFiltersSheet } from '@/components/paw/feed-search-filters-sheet';
import { PostCommentsSheet } from '@/components/paw/post-comments-sheet';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import { useAuth } from '@/context/auth';
import { useFeedPosts } from '@/context/feed-posts';
import { useProfileOnboarding } from '@/context/profile-onboarding';
import { useFeedNearbyCities } from '@/hooks/use-feed-nearby-cities';
import * as feedApi from '@/lib/api/feed';
import type { FeedPostApi } from '@/lib/api/types';

function formatPostDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SocialFeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const { refreshNonce, pendingPost, clearPendingPost } = useFeedPosts();
  const { draft, handle: myHandle, resetOnboardingForDev } = useProfileOnboarding();
  const { userId } = useAuth();
  const [viewMode, setViewMode] = useState<FeedMapMode>('feed');
  const [search, setSearch] = useState('');
  const [searchFilters, setSearchFilters] = useState<FeedSearchFilters>(EMPTY_FEED_SEARCH_FILTERS);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [radiusKm, setRadiusKm] = useState<FeedRadiusKm>('');
  const [postScope, setPostScope] = useState<FeedPostScope>('all');
  const [posts, setPosts] = useState<FeedPostApi[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [commentsPost, setCommentsPost] = useState<FeedPostApi | null>(null);
  const activeFilterCount = countActiveFeedSearchFilters(searchFilters);
  const {
    permission: cityPermission,
    blockedReason,
    cityOptions,
    citiesRefreshing,
    requestLocationAccess,
  } = useFeedNearbyCities(radiusKm);

  const mergePosts = useCallback((fetched: FeedPostApi[]) => {
    if (!pendingPost) return fetched;
    const withoutDup = fetched.filter((p) => p.id !== pendingPost.id);
    return [pendingPost, ...withoutDup];
  }, [pendingPost]);

  const loadPosts = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) setLoadingPosts(true);
      try {
        const data = await feedApi.listFeedPosts(
          buildListFeedPostsParams({
            searchText: search,
            searchFilters,
            selectedCity,
            radiusKm,
            postScope,
          }),
        );
        setPosts(mergePosts(data));
        clearPendingPost();
      } catch {
        setPosts(pendingPost ? [pendingPost] : []);
      } finally {
        if (!silent) setLoadingPosts(false);
      }
    },
    [
      radiusKm,
      postScope,
      search,
      searchFilters,
      selectedCity,
      mergePosts,
      pendingPost,
      clearPendingPost,
    ],
  );

  useEffect(() => {
    if (viewMode !== 'feed') return;
    void loadPosts();
  }, [viewMode, loadPosts]);

  useFocusEffect(
    useCallback(() => {
      if (viewMode !== 'feed') return;
      void loadPosts({ silent: true });
    }, [viewMode, loadPosts, refreshNonce]),
  );

  useEffect(() => {
    if (!pendingPost || viewMode !== 'feed') return;
    setPosts((prev) => {
      if (prev.some((p) => p.id === pendingPost.id)) return prev;
      return [pendingPost, ...prev];
    });
  }, [pendingPost, viewMode]);

  const onRefresh = useCallback(() => {
    if (viewMode !== 'feed') return;
    setRefreshing(true);
    void loadPosts({ silent: true }).finally(() => setRefreshing(false));
  }, [viewMode, loadPosts]);

  const onToggleLike = async (postId: string) => {
    try {
      const result = await feedApi.togglePostLike(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likedByMe: result.liked, likeCount: result.likeCount }
            : p,
        ),
      );
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          viewMode === 'feed' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PawColors.navLabelActive}
              colors={[PawColors.peachBorder]}
              progressBackgroundColor={PawColors.creamBg}
            />
          ) : undefined
        }>
        <View style={styles.logoRow}>
          <PawLogo variant="mark" width={182} height={114} />
        </View>

        <View style={styles.searchShell}>
          <Feather name="search" size={22} color={PawColors.black} accessibilityLabel="Search" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => void loadPosts()}
            placeholder="Search post text"
            placeholderTextColor={PawColors.searchPlaceholder}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search post text"
          />
          <Pressable
            hitSlop={8}
            onPress={() => setFiltersSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Filters"
            accessibilityHint="Filter by city, author, pet gender, age, or size">
            <View style={styles.filterIconWrap}>
              <Feather
                name="sliders"
                size={22}
                color={activeFilterCount > 0 ? PawColors.peachBorder : PawColors.black}
              />
              {activeFilterCount > 0 ? (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>

        <FeedSearchFiltersSheet
          visible={filtersSheetOpen}
          initialFilters={searchFilters}
          onClose={() => setFiltersSheetOpen(false)}
          onApply={(filters) => {
            setSearchFilters(filters);
            void loadPosts();
          }}
        />

        {commentsPost ? (
          <PostCommentsSheet
            visible
            postId={commentsPost.id}
            postLabel={commentsPost.author?.petName ?? commentsPost.author?.fullName}
            onClose={() => setCommentsPost(null)}
            onCountChange={(count) => {
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === commentsPost.id ? { ...p, commentCount: count } : p,
                ),
              );
            }}
          />
        ) : null}

        <View style={styles.chipsRow}>
          <FeedCityAreaChip
            permission={cityPermission}
            blockedReason={blockedReason}
            cityOptions={cityOptions}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            onRequestLocation={requestLocationAccess}
            citiesRefreshing={citiesRefreshing}
          />
          <ChipOptionDropdown<FeedRadiusKm>
            value={radiusKm}
            options={FEED_RADIUS_OPTIONS}
            onChange={setRadiusKm}
            sheetTitle="Distance from you"
            accessibilityLabel="Search radius"
            accessibilityHint="Choose how far from your location to show posts"
          />
        </View>

        <View style={styles.toggleRow}>
          <FeedMapToggle mode={viewMode} onChange={setViewMode} />
          <ChipOptionDropdown<FeedPostScope>
            value={postScope}
            options={FEED_POST_SCOPE_OPTIONS}
            onChange={setPostScope}
            sheetTitle="Posts"
            accessibilityLabel="Post filter"
            accessibilityHint="Choose all posts, friends posts, or your posts"
            compact
          />
        </View>

        {viewMode === 'map' ? (
          <FeedDiscoveryMap
            active={viewMode === 'map'}
            selfUserId={userId}
            selfHandle={myHandle}
            selfLabel={draft.fullName.trim() || 'You'}
            selfPetLabel={draft.dogName.trim() || undefined}
            selfPetPhotoUrl={draft.dogPhotoUri}
            selfOwnerPhotoUrl={draft.humanPhotoUri}
          />
        ) : (
          <>
            <Pressable
              style={styles.newPost}
              onPress={() => router.push('/new-post')}
              accessibilityRole="button"
              accessibilityLabel="New post">
              <Feather name="plus" size={24} color={PawColors.black} />
              <Text style={styles.newPostText}>New post</Text>
            </Pressable>

            {loadingPosts ? (
              <Text style={styles.emptyFeed}>Loading posts…</Text>
            ) : posts.length === 0 ? (
              <Text style={styles.emptyFeed}>
                {search.trim() || activeFilterCount > 0 || selectedCity || radiusKm || postScope !== 'all'
                  ? 'No posts match your filters.'
                  : 'No posts yet. Be the first to share!'}
              </Text>
            ) : (
              posts.map((post) => {
                const dogName = post.author?.petName ?? 'Dog';
                const ownerName = post.author?.fullName ?? 'Owner';
                const handle = post.author?.handle ?? '';
                return (
                  <View key={post.id} style={styles.post}>
                    <View style={styles.postHeader}>
                      {handle ? (
                        <FeedPostAvatar
                          handle={handle}
                          userId={post.author?.id}
                          dogName={dogName}
                          ownerName={ownerName}
                          petPhotoUrl={post.author?.petPhotoUrl}
                          ownerPhotoUrl={post.author?.photoUrl}
                        />
                      ) : null}
                      <View style={styles.postNames}>
                        <Text style={styles.dogName}>{dogName}</Text>
                        <Text style={styles.ownerName}>{ownerName}</Text>
                      </View>
                      <View style={styles.checkBadge} accessibilityLabel="Verified">
                        <MaterialCommunityIcons name="check-decagram" size={22} color={PawColors.badgeBlue} />
                      </View>
                    </View>
                    {post.body ? <Text style={styles.postBody}>{post.body}</Text> : null}
                    <FeedPostImages imageUrls={post.imageUrls} />
                    <View style={styles.postFooter}>
                      <Text style={styles.dateText}>{formatPostDate(post.createdAt)}</Text>
                      <View style={styles.metrics}>
                        <Pressable
                          style={styles.metric}
                          onPress={() => void onToggleLike(post.id)}
                          accessibilityRole="button">
                          <Feather
                            name="heart"
                            size={20}
                            color={post.likedByMe ? PawColors.peachBorder : PawColors.black}
                          />
                          <Text style={styles.metricText}>{post.likeCount}</Text>
                        </Pressable>
                        <Pressable
                          style={styles.metric}
                          onPress={() => setCommentsPost(post)}
                          accessibilityRole="button"
                          accessibilityLabel="View comments">
                          <Feather name="message-circle" size={20} color={PawColors.black} />
                          <Text style={styles.metricText}>{post.commentCount}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {__DEV__ ? (
          <Pressable
            onPress={async () => {
              await resetOnboardingForDev();
              await logout();
              router.replace('/splash');
            }}
            style={styles.devReset}>
            <Text style={styles.devResetText}>Reset onboarding (dev)</Text>
          </Pressable>
        ) : null}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PawColors.creamBg,
    maxWidth: PawLayout.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  scroll: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingBottom: 24,
  },
  logoRow: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    minHeight: 114,
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: 13,
    minHeight: 52,
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
    paddingVertical: 10,
  },
  filterIconWrap: {
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PawColors.peachBorder,
    borderWidth: 1,
    borderColor: PawColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PawColors.black,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  mapPlaceholder: {
    marginTop: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.whiteCard,
    alignItems: 'center',
    gap: 10,
  },
  mapPlaceholderTitle: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.black,
  },
  mapPlaceholderHint: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textMuted,
    textAlign: 'center',
  },
  newPost: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: PawColors.peachBorder,
    borderWidth: 3,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    height: 50,
  },
  newPostText: {
    fontSize: PawFontSize.body,
    fontWeight: '800',
    color: PawColors.black,
  },
  post: {
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.whiteCard,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postNames: {
    flex: 1,
    gap: 4,
  },
  dogName: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  ownerName: {
    fontSize: PawFontSize.body,
    fontWeight: '400',
    color: PawColors.chipGray,
  },
  checkBadge: {
    width: 36,
    height: 28,
    borderRadius: 8,
    borderWidth: 0.7,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBody: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textMuted,
    textAlign: 'justify',
    lineHeight: PawLineHeight.body,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: PawFontSize.small,
    fontWeight: '300',
    color: PawColors.black,
    letterSpacing: -0.14,
  },
  metrics: {
    flexDirection: 'row',
    gap: 20,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: PawFontSize.small,
    fontWeight: '300',
    color: PawColors.black,
    letterSpacing: -0.7,
  },
  devReset: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  devResetText: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.textMuted,
    textDecorationLine: 'underline',
  },
  emptyFeed: {
    marginTop: 24,
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textMuted,
    textAlign: 'center',
  },
});
