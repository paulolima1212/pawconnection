import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import {
  ProfileAvatarActionSheet,
  type ProfileAvatarAction,
} from '@/components/paw/profile-avatar-action-sheet';
import { ProfilePhotosLightbox } from '@/components/paw/profile-photos-lightbox';
import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PawColors } from '@/constants/paw-styles';
import { useAuth } from '@/context/auth';
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import { useProfileOnboarding } from '@/context/profile-onboarding';
import * as chatApi from '@/lib/api/chat';
import { resolveMediaDisplayUrl } from '@/lib/api/media';

const IMG_DOG_AVATAR = 'https://www.figma.com/api/mcp/asset/ddcd8fa6-d1af-4e2f-9d65-23d82344bad6';
const IMG_HUMAN_AVATAR = 'https://www.figma.com/api/mcp/asset/c1ef6353-145d-4fed-a0e3-a4543af4c7bb';

type FeedPostAvatarProps = {
  handle: string;
  /** Author user id when available (faster chat start). */
  userId?: string | null;
  dogName: string;
  ownerName: string;
  petPhotoUrl?: string | null;
  ownerPhotoUrl?: string | null;
  /** On profile screen: tap opens swipeable photos. On feed: shows action menu. */
  mode?: 'feed' | 'photos-only';
  scale?: number;
};

function normalizeHandle(value: string) {
  return value.replace(/^@/, '').trim().toLowerCase();
}

export function FeedPostAvatar({
  handle,
  userId,
  dogName,
  ownerName,
  petPhotoUrl,
  ownerPhotoUrl,
  mode = 'feed',
  scale = 1,
}: FeedPostAvatarProps) {
  const router = useRouter();
  const { isAuthenticated, userId: myUserId } = useAuth();
  const { handle: myHandle } = useProfileOnboarding();
  const { showTooltip } = usePawTooltip();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [startingChat, setStartingChat] = useState(false);

  const isSelf = useMemo(() => {
    if (userId && myUserId && userId === myUserId) return true;
    if (myHandle && handle) return normalizeHandle(handle) === normalizeHandle(myHandle);
    return false;
  }, [userId, myUserId, myHandle, handle]);

  const dogPhoto = resolveMediaDisplayUrl(petPhotoUrl ?? null) ?? IMG_DOG_AVATAR;
  const humanPhoto = resolveMediaDisplayUrl(ownerPhotoUrl ?? null) ?? IMG_HUMAN_AVATAR;

  const slides = useMemo(
    () =>
      [
        { uri: dogPhoto, label: dogName },
        { uri: humanPhoto, label: ownerName },
      ].filter((s) => Boolean(s.uri)),
    [dogPhoto, humanPhoto, dogName, ownerName],
  );

  const openPhotos = (startOnOwner: boolean) => {
    const idx = startOnOwner ? Math.min(1, slides.length - 1) : 0;
    setLightboxStartIndex(idx);
    setLightboxOpen(true);
  };

  const startChat = async () => {
    if (isSelf) {
      showTooltip({
        title: 'Not available',
        message: 'You cannot send a message to yourself.',
        variant: 'info',
      });
      return;
    }
    if (!isAuthenticated) {
      showTooltip({
        title: 'Sign in required',
        message: 'Log in to send a private message.',
        variant: 'info',
      });
      return;
    }
    setStartingChat(true);
    try {
      const conversation = await chatApi.startConversationWithProfile({
        id: userId ?? undefined,
        handle,
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

  const onMenuSelect = (action: ProfileAvatarAction) => {
    if (action === 'profile') {
      router.push(`/user/${encodeURIComponent(handle)}`);
      return;
    }
    if (action === 'message') {
      void startChat();
      return;
    }
    openPhotos(false);
  };

  const onPress = () => {
    if (mode === 'photos-only') {
      openPhotos(false);
      return;
    }
    setMenuOpen(true);
  };

  return (
    <>
      <ProfileAvatarActionSheet
        visible={menuOpen}
        dogName={dogName}
        ownerName={ownerName}
        dogPhotoUri={dogPhoto}
        humanPhotoUri={humanPhoto}
        showMessage={!isSelf}
        onClose={() => setMenuOpen(false)}
        onSelect={onMenuSelect}
      />

      <View style={[styles.dualWrap, scale !== 1 && { transform: [{ scale }] }]}>
        {startingChat ? (
          <View style={styles.chatBusyOverlay} pointerEvents="none">
            <ActivityIndicator size="small" color={PawColors.peachBorder} />
          </View>
        ) : null}
        <Pressable
          onPress={onPress}
          disabled={startingChat}
          style={({ pressed }) => [styles.dualPressable, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${dogName}, ${ownerName}`}
          accessibilityHint="Opens profile or photo options">
          <RemoteMediaImage uri={dogPhoto} style={styles.dualDog} contentFit="cover" />
          <RemoteMediaImage uri={humanPhoto} style={styles.dualHuman} contentFit="cover" />
        </Pressable>
      </View>

      <ProfilePhotosLightbox
        visible={lightboxOpen}
        photos={slides}
        initialIndex={lightboxStartIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dualWrap: {
    width: 62,
    height: 61,
    position: 'relative',
  },
  dualPressable: {
    width: '100%',
    height: '100%',
  },
  chatBusyOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 253, 210, 0.65)',
    borderRadius: 32,
  },
  pressed: {
    opacity: 0.88,
  },
  dualDog: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
  dualHuman: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
});
