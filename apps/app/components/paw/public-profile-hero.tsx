import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  PublicProfileHandleBadge,
  PublicProfileHeroBand,
  PublicProfileLocationChip,
  PublicProfileVerifiedTitle,
} from '@/components/paw/public-profile-parts';
import { ProfilePhotosLightbox } from '@/components/paw/profile-photos-lightbox';
import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PawColors } from '@/constants/paw-styles';
import { resolveMediaDisplayUrl } from '@/lib/api/media';

const IMG_DOG_AVATAR = 'https://www.figma.com/api/mcp/asset/ddcd8fa6-d1af-4e2f-9d65-23d82344bad6';
const IMG_HUMAN_AVATAR = 'https://www.figma.com/api/mcp/asset/c1ef6353-145d-4fed-a0e3-a4543af4c7bb';

type PublicProfileHeroProps = {
  dogName: string;
  ownerName: string;
  handle: string;
  location?: string | null;
  petPhotoUrl?: string | null;
  ownerPhotoUrl?: string | null;
};

export function PublicProfileHero({
  dogName,
  ownerName,
  handle,
  location,
  petPhotoUrl,
  ownerPhotoUrl,
}: PublicProfileHeroProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const dogPhoto = resolveMediaDisplayUrl(petPhotoUrl ?? null) ?? IMG_DOG_AVATAR;
  const humanPhoto = resolveMediaDisplayUrl(ownerPhotoUrl ?? null) ?? IMG_HUMAN_AVATAR;

  const slides = useMemo(
    () => [
      { uri: dogPhoto, label: dogName },
      { uri: humanPhoto, label: ownerName },
    ],
    [dogPhoto, humanPhoto, dogName, ownerName],
  );

  return (
    <PublicProfileHeroBand>
      <View style={styles.avatarStage}>
        <Pressable
          onPress={() => setLightboxOpen(true)}
          style={({ pressed }) => [styles.avatarPress, pressed && styles.avatarPressed]}
          accessibilityRole="button"
          accessibilityLabel={`${dogName}, ${ownerName}`}
          accessibilityHint="Opens photos full screen">
          <RemoteMediaImage uri={dogPhoto} style={styles.dogPhoto} contentFit="cover" />
          <RemoteMediaImage uri={humanPhoto} style={styles.humanPhoto} contentFit="cover" />
        </Pressable>
      </View>

      <View style={styles.identity}>
        <PublicProfileVerifiedTitle name={dogName} />
        <Text style={styles.withOwner}>with {ownerName}</Text>
        <View style={styles.metaRow}>
          <PublicProfileHandleBadge handle={handle} />
          {location?.trim() ? <PublicProfileLocationChip location={location} /> : null}
        </View>
      </View>

      <ProfilePhotosLightbox
        visible={lightboxOpen}
        photos={slides}
        onClose={() => setLightboxOpen(false)}
      />
    </PublicProfileHeroBand>
  );
}

const AVATAR = {
  stageW: 112,
  stageH: 108,
  dog: 100,
  human: 44,
} as const;

const styles = StyleSheet.create({
  avatarStage: {
    width: AVATAR.stageW,
    height: AVATAR.stageH,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarPress: {
    width: AVATAR.stageW,
    height: AVATAR.stageH,
    position: 'relative',
  },
  avatarPressed: {
    opacity: 0.92,
  },
  dogPhoto: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: AVATAR.dog,
    height: AVATAR.dog,
    borderRadius: AVATAR.dog / 2,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
  },
  humanPhoto: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: AVATAR.human,
    height: AVATAR.human,
    borderRadius: AVATAR.human / 2,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
  },
  identity: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  withOwner: {
    fontSize: 15,
    fontWeight: '400',
    color: PawColors.chipGray,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
});
