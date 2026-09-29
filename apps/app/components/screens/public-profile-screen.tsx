import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawSegmentedSwitch } from '@/components/paw/paw-segmented-switch';
import {
  PublicProfileBioBlock,
  PublicProfileChipGrid,
  PublicProfileDetailRow,
  PublicProfileEnjoyRow,
  PublicProfileSectionCard,
} from '@/components/paw/public-profile-parts';
import { PublicProfileHero } from '@/components/paw/public-profile-hero';
import { BlockUserConfirmSheet } from '@/components/paw/block-user-confirm-sheet';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { useAuth } from '@/context/auth';
import { CONNECTION_INTENT_FRIENDSHIP } from '@/context/profile-onboarding';
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import { formatDeclarationStatus, formatGender, formatTemperamentList } from '@/lib/profile-labels';
import * as chatApi from '@/lib/api/chat';
import * as inboxApi from '@/lib/api/inbox';
import * as profileApi from '@/lib/api/profile';
import * as moderationApi from '@/lib/api/moderation';
import type { ProfileMeResponse } from '@/lib/api/types';
import {
  connectButtonEnabled,
  connectButtonLabel,
  type ProfileConnectionStatus,
} from '@/lib/profile-connection';

type PublicProfileTab = 'pet' | 'owner';

type PublicProfileScreenProps = {
  handle: string;
};

function formatAge(years: number | null | undefined): string {
  if (years == null || Number.isNaN(years)) return '';
  return years === 1 ? '1 year' : `${years} years`;
}

export function PublicProfileScreen({ handle }: PublicProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();
  const { showTooltip } = usePawTooltip();
  const showTooltipRef = useRef(showTooltip);
  showTooltipRef.current = showTooltip;
  const [profile, setProfile] = useState<ProfileMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const [tab, setTab] = useState<PublicProfileTab>('pet');
  const [blockOpen, setBlockOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ProfileConnectionStatus>('none');
  const [connectionRequestId, setConnectionRequestId] = useState<string | null>(null);
  const [connectionReady, setConnectionReady] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setConnectionReady(false);

    void (async () => {
      try {
        const data = await profileApi.getPublicProfile(handle);
        if (cancelled) return;
        setProfile(data);
        setBlockedByMe(Boolean(data.blockedByMe));
        const viewingSomeoneElse = Boolean(data.id && userId && data.id !== userId);
        if (isAuthenticated && viewingSomeoneElse && data.id) {
          try {
            const connection = await inboxApi.getConnectionWithUser(data.id);
            if (!cancelled) {
              setConnectionStatus(connection.status);
              setConnectionRequestId(connection.requestId);
            }
          } catch {
            if (!cancelled) {
              setConnectionStatus('none');
              setConnectionRequestId(null);
            }
          }
        } else if (!cancelled) {
          setConnectionStatus('none');
          setConnectionRequestId(null);
        }
      } catch (err) {
        if (!cancelled) {
          showTooltipRef.current({
            title: 'Profile unavailable',
            message: tooltipMessageFromError(err, 'Could not load profile.'),
            variant: 'error',
            onDismiss: () => router.back(),
          });
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setConnectionReady(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handle, isAuthenticated, router, userId]);

  const pet = profile?.pet;
  const owner = profile?.owner;
  const dogName = pet?.name ?? 'Dog';
  const ownerName = owner?.fullName ?? 'Owner';
  const ownerFirst = ownerName.split(/\s+/)[0] || ownerName;
  const hasPetDetails = Boolean(
    pet?.breed?.trim() ||
      pet?.age != null ||
      pet?.gender ||
      (Array.isArray(pet?.temperament) ? pet.temperament.length > 0 : pet?.temperament) ||
      pet?.vaccinated ||
      pet?.desexed,
  );
  const hasPetFavorites = Boolean(pet?.favoritesThings?.trim() || pet?.favoriteMeal?.trim());

  const startChat = async () => {
    if (!isAuthenticated) {
      showTooltip({
        title: 'Sign in required',
        message: 'Log in to send a private message.',
        variant: 'info',
      });
      return;
    }
    if (blockedByMe) {
      showTooltip({
        title: 'User blocked',
        message: 'Unblock this user to send a message.',
        variant: 'info',
      });
      return;
    }
    if (!profile) return;
    setStartingChat(true);
    try {
      const conversation = await chatApi.startConversationWithProfile({
        id: profile.id,
        handle: profile.handle,
      });
      router.push(`/chat/${conversation.id}`);
    } catch (err) {
      showTooltip({
        title: 'Chat indisponível',
        message: tooltipMessageFromError(err, 'Não foi possível iniciar o chat.'),
        variant: 'error',
        durationMs: 6000,
      });
    } finally {
      setStartingChat(false);
    }
  };

  const isOwnProfile = Boolean(profile?.id && userId && profile.id === userId);
  const blockName = ownerFirst;
  const showConnect = Boolean(profile && !isOwnProfile && !blockedByMe);
  const connectQuiet = connectionStatus === 'outgoing' || connectionStatus === 'connected';

  const onConnect = async () => {
    if (!isAuthenticated) {
      showTooltip({
        title: 'Sign in required',
        message: 'Log in to send a connection request.',
        variant: 'info',
      });
      return;
    }
    if (!profile?.id || blockedByMe || !connectButtonEnabled(connectionStatus)) return;
    setConnecting(true);
    try {
      if (connectionStatus === 'incoming' && connectionRequestId) {
        await inboxApi.acceptInboxRequest(connectionRequestId);
        setConnectionStatus('connected');
        showTooltip({
          title: 'Connected',
          message: `You and ${ownerFirst} are now connected.`,
          variant: 'success',
        });
        return;
      }
      const created = await inboxApi.createConnectionRequest(
        profile.id,
        CONNECTION_INTENT_FRIENDSHIP,
      );
      setConnectionStatus('outgoing');
      setConnectionRequestId(created.id);
      showTooltip({
        title: 'Request sent',
        message: `${ownerFirst} can accept your connection request.`,
        variant: 'success',
      });
    } catch (err) {
      showTooltip({
        title: 'Could not connect',
        message: tooltipMessageFromError(err, 'Please try again.'),
        variant: 'error',
      });
    } finally {
      setConnecting(false);
    }
  };

  const confirmBlock = async () => {
    if (!profile?.id) return;
    setBlocking(true);
    try {
      if (blockedByMe) {
        await moderationApi.unblockUser(profile.id);
        setBlockedByMe(false);
        setBlockOpen(false);
        showTooltip({
          title: 'User unblocked',
          message: `You can message ${blockName} again.`,
          variant: 'success',
        });
      } else {
        await moderationApi.blockUser(profile.id);
        setBlockedByMe(true);
        setBlockOpen(false);
        showTooltip({
          title: 'User blocked',
          message: `${blockName} can no longer see or interact with you.`,
          variant: 'success',
        });
      }
    } catch (err) {
      showTooltip({
        title: blockedByMe ? 'Could not unblock' : 'Could not block',
        message: tooltipMessageFromError(err, 'Please try again.'),
        variant: 'error',
      });
    } finally {
      setBlocking(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <View style={styles.headerBtnCircle}>
            <Feather name="arrow-left" size={22} color={PawColors.black} />
          </View>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Profile
        </Text>
        <View style={styles.headerRight}>
          {!isOwnProfile && isAuthenticated && profile ? (
            <Pressable
              onPress={() => {
                if (blockedByMe) {
                  void confirmBlock();
                  return;
                }
                setBlockOpen(true);
              }}
              hitSlop={8}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel={blockedByMe ? `Unblock ${blockName}` : `Block ${blockName}`}>
              <View style={[styles.headerBtnCircle, blockedByMe && styles.unblockCircle]}>
                <Feather
                  name={blockedByMe ? 'unlock' : 'slash'}
                  size={18}
                  color={blockedByMe ? PawColors.black : PawColors.destructive}
                />
              </View>
            </Pressable>
          ) : (
            <View style={styles.headerBtn} />
          )}
          <Pressable
            onPress={() => void startChat()}
            disabled={startingChat || loading || isOwnProfile || blockedByMe}
            hitSlop={8}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel={blockedByMe ? 'Messaging unavailable' : 'Send message'}>
            {startingChat ? (
              <ActivityIndicator size="small" color={PawColors.peachBorder} />
            ) : (
              <View style={styles.headerBtnCircle}>
                <Feather name="message-circle" size={20} color={PawColors.black} />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PawColors.peachBorder} />
        </View>
      ) : profile ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(32, insets.bottom + 16) },
          ]}
          showsVerticalScrollIndicator={false}>
          <PublicProfileHero
            dogName={dogName}
            ownerName={ownerName}
            handle={profile.handle}
            location={owner?.location}
            petPhotoUrl={pet?.photoUrl}
            ownerPhotoUrl={owner?.photoUrl}
          />

          {showConnect ? (
            <View style={styles.connectWrap}>
              {!isAuthenticated || connectionReady ? (
                <Pressable
                  onPress={() => void onConnect()}
                  disabled={
                    connecting ||
                    (isAuthenticated && !connectButtonEnabled(connectionStatus))
                  }
                  style={[styles.connectBtn, connectQuiet && styles.connectBtnQuiet]}
                  accessibilityRole="button"
                  accessibilityLabel={connectButtonLabel(
                    isAuthenticated ? connectionStatus : 'none',
                  )}>
                  {connecting ? (
                    <ActivityIndicator color={PawColors.black} />
                  ) : (
                    <Text style={[styles.connectText, connectQuiet && styles.connectTextQuiet]}>
                      {connectButtonLabel(isAuthenticated ? connectionStatus : 'none')}
                    </Text>
                  )}
                </Pressable>
              ) : (
                <ActivityIndicator color={PawColors.peachBorder} />
              )}
            </View>
          ) : null}

          {!isOwnProfile && isAuthenticated ? (
            <View style={styles.moderationRow}>
              {blockedByMe ? (
                <Text style={styles.blockedBanner}>This user is blocked. They cannot message you.</Text>
              ) : null}
              <Pressable
                onPress={() => {
                  if (blockedByMe) {
                    void confirmBlock();
                    return;
                  }
                  setBlockOpen(true);
                }}
                disabled={blocking}
                style={[styles.blockActionBtn, blockedByMe && styles.unblockActionBtn]}
                accessibilityRole="button"
                accessibilityLabel={blockedByMe ? `Unblock ${blockName}` : `Block ${blockName}`}>
                <Text style={[styles.blockActionText, blockedByMe && styles.unblockActionText]}>
                  {blockedByMe ? 'Unblock' : 'Block'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.tabWrap}>
            <PawSegmentedSwitch
              variant="profile"
              tabs={[
                { id: 'pet' as const, label: 'Pet' },
                { id: 'owner' as const, label: 'Owner' },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>

          {tab === 'pet' ? (
            <View style={styles.sections}>
              {(pet?.bio?.trim() ?? '') !== '' ? (
                <PublicProfileSectionCard title="About">
                  <PublicProfileBioBlock text={pet!.bio!} />
                </PublicProfileSectionCard>
              ) : null}

              {hasPetDetails ? (
                <PublicProfileSectionCard title="Details">
                  <PublicProfileDetailRow icon="tag" label="Breed" value={pet?.breed ?? ''} />
                  <PublicProfileDetailRow icon="calendar" label="Age" value={formatAge(pet?.age)} />
                  <PublicProfileDetailRow icon="heart" label="Gender" value={formatGender(pet?.gender)} />
                  <PublicProfileDetailRow
                    icon="smile"
                    label="Temperament"
                    value={formatTemperamentList(pet?.temperament, pet?.customTemperament)}
                  />
                  <PublicProfileDetailRow
                    icon="shield"
                    label="Vaccinated"
                    value={formatDeclarationStatus(pet?.vaccinated)}
                  />
                  <PublicProfileDetailRow
                    icon="heart"
                    label="Desexed"
                    value={formatDeclarationStatus(pet?.desexed)}
                  />
                </PublicProfileSectionCard>
              ) : null}

              {pet ? (
                <PublicProfileSectionCard title="Loves">
                  <PublicProfileEnjoyRow label="Enjoys the park" active={pet.enjoysPark ?? false} />
                  <PublicProfileEnjoyRow label="Enjoys water play" active={pet.enjoysWater ?? false} />
                  <PublicProfileEnjoyRow label="Enjoys long walks" active={pet.enjoysWalks ?? false} />
                </PublicProfileSectionCard>
              ) : null}

              {hasPetFavorites ? (
                <PublicProfileSectionCard title="Favorites">
                  <PublicProfileDetailRow
                    icon="star"
                    label="Favorite things"
                    value={pet?.favoritesThings ?? ''}
                  />
                  <PublicProfileDetailRow
                    icon="coffee"
                    label="Favorite meal"
                    value={pet?.favoriteMeal ?? ''}
                  />
                </PublicProfileSectionCard>
              ) : null}
            </View>
          ) : (
            <View style={styles.sections}>
              {(owner?.bio?.trim() ?? '') !== '' ? (
                <PublicProfileSectionCard title={`About ${ownerFirst}`}>
                  <PublicProfileBioBlock text={owner!.bio!} />
                </PublicProfileSectionCard>
              ) : null}

              <PublicProfileSectionCard title="Details">
                <PublicProfileDetailRow icon="user" label="Full name" value={ownerName} />
                <PublicProfileDetailRow icon="calendar" label="Age" value={formatAge(owner?.age)} />
                <PublicProfileDetailRow icon="users" label="Gender" value={formatGender(owner?.gender)} />
                {owner?.location ? (
                  <PublicProfileDetailRow icon="map-pin" label="Location" value={owner.location} />
                ) : null}
              </PublicProfileSectionCard>

              {profile.interests?.length ? (
                <PublicProfileSectionCard title="Interests">
                  <PublicProfileChipGrid items={profile.interests.map(String)} />
                </PublicProfileSectionCard>
              ) : null}
            </View>
          )}
        </ScrollView>
      ) : null}

      <BlockUserConfirmSheet
        visible={blockOpen}
        displayName={blockName}
        blocking={blocking}
        onClose={() => setBlockOpen(false)}
        onConfirm={() => void confirmBlock()}
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: PawColors.profileHeaderBorder,
    backgroundColor: PawColors.creamBg,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockCircle: {
    backgroundColor: PawColors.peachBorder,
  },
  connectWrap: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 16,
    alignItems: 'center',
  },
  connectBtn: {
    minHeight: 50,
    width: '100%',
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 3,
    borderColor: PawColors.black,
    backgroundColor: PawColors.peachBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  connectBtnQuiet: {
    backgroundColor: PawColors.fieldWhite,
  },
  connectText: {
    fontSize: PawFontSize.body,
    fontWeight: '800',
    color: PawColors.black,
  },
  connectTextQuiet: {
    fontWeight: '700',
  },
  moderationRow: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 16,
    gap: 10,
    alignItems: 'center',
  },
  blockedBanner: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.destructive,
    textAlign: 'center',
  },
  blockActionBtn: {
    minHeight: 44,
    minWidth: 160,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.destructive,
    backgroundColor: PawColors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  unblockActionBtn: {
    borderColor: PawColors.black,
    backgroundColor: PawColors.peachBorder,
  },
  blockActionText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.fieldWhite,
  },
  unblockActionText: {
    color: PawColors.black,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.black,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tabWrap: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 20,
    paddingBottom: 4,
  },
  sections: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 16,
    gap: 14,
  },
});
