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
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import * as chatApi from '@/lib/api/chat';
import * as profileApi from '@/lib/api/profile';
import * as moderationApi from '@/lib/api/moderation';
import type { ProfileMeResponse } from '@/lib/api/types';

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const data = await profileApi.getPublicProfile(handle);
        if (!cancelled) {
          setProfile(data);
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
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handle, router]);

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

  const confirmBlock = async () => {
    if (!profile?.id) return;
    setBlocking(true);
    try {
      await moderationApi.blockUser(profile.id);
      setBlockOpen(false);
      showTooltip({
        title: 'User blocked',
        message: `${blockName} can no longer see or interact with you.`,
        variant: 'success',
      });
      router.back();
    } catch (err) {
      showTooltip({
        title: 'Could not block',
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
              onPress={() => setBlockOpen(true)}
              hitSlop={8}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel={`Block ${blockName}`}>
              <View style={styles.headerBtnCircle}>
                <Feather name="more-horizontal" size={20} color={PawColors.black} />
              </View>
            </Pressable>
          ) : (
            <View style={styles.headerBtn} />
          )}
          <Pressable
            onPress={() => void startChat()}
            disabled={startingChat || loading || isOwnProfile}
            hitSlop={8}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Send message">
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
                  <PublicProfileDetailRow icon="heart" label="Gender" value={pet?.gender ?? ''} />
                  <PublicProfileDetailRow
                    icon="smile"
                    label="Temperament"
                    value={
                      Array.isArray(pet?.temperament)
                        ? pet.temperament.join(', ')
                        : (pet?.temperament ?? '')
                    }
                  />
                  <PublicProfileDetailRow
                    icon="shield"
                    label="Vaccinated"
                    value={pet?.vaccinated ?? ''}
                  />
                  <PublicProfileDetailRow
                    icon="heart"
                    label="Desexed"
                    value={pet?.desexed ?? ''}
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
                <PublicProfileDetailRow icon="users" label="Gender" value={owner?.gender ?? ''} />
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
