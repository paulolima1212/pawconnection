import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  avatarUriForFocus,
  photosForFocus,
  type MatchFeedCard,
  type MatchFeedFocus,
} from '@/constants/match-feed';
import { PawColors, PawLayout } from '@/constants/paw-styles';

type MatchHeroGalleryProps = {
  card: MatchFeedCard;
  focus: MatchFeedFocus;
  photoIndex: number;
  onFocusChange: (focus: MatchFeedFocus) => void;
  onPhotoIndexChange: (index: number) => void;
};

export function MatchHeroGallery({
  card,
  focus,
  photoIndex,
  onFocusChange,
  onPhotoIndexChange,
}: MatchHeroGalleryProps) {
  const photos = photosForFocus(card, focus);
  const safeIndex = photos.length > 0 ? Math.min(photoIndex, photos.length - 1) : 0;
  const heroUri = photos[safeIndex] ?? null;
  const avatarUri = avatarUriForFocus(card, focus);

  const swapFocus = () => {
    onFocusChange(focus === 'pet' ? 'owner' : 'pet');
    onPhotoIndexChange(0);
  };

  const goToPhoto = (index: number) => {
    if (index >= 0 && index < photos.length) {
      onPhotoIndexChange(index);
    }
  };

  return (
    <View style={styles.heroBlock}>
      <View style={styles.indicators}>
        {(photos.length > 0 ? photos : [null]).map((_, i) => (
          <Pressable key={i} onPress={() => goToPhoto(i)} accessibilityRole="button">
            <View
              style={[
                styles.indicator,
                i === safeIndex ? styles.indicatorActive : styles.indicatorInactive,
              ]}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.heroOverlap}>
        <View style={styles.dogFrame}>
          {heroUri ? (
            <Image source={{ uri: heroUri }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback]} />
          )}
        </View>

        {avatarUri ? (
          <Pressable
            onPress={swapFocus}
            style={styles.avatarPress}
            accessibilityRole="button"
            accessibilityLabel={
              focus === 'pet'
                ? `Show ${card.ownerFirstName}'s photos`
                : `Show ${card.petName}'s photos`
            }>
            <Image source={{ uri: avatarUri }} style={styles.avatarOnDog} contentFit="cover" />
          </Pressable>
        ) : (
          <Pressable
            onPress={swapFocus}
            style={styles.avatarPress}
            accessibilityRole="button"
            accessibilityLabel="Switch photo focus">
            <View style={[styles.avatarOnDog, styles.avatarFallback]} />
          </Pressable>
        )}
      </View>

      <Text style={styles.focusHint}>
        {focus === 'pet' ? card.petName : card.ownerFirstName}
        {photos.length > 1 ? ` · ${safeIndex + 1}/${photos.length}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBlock: {
    alignItems: 'center',
    marginTop: 8,
  },
  indicators: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
    alignSelf: 'center',
    minHeight: 5,
  },
  indicator: {
    width: 90,
    height: 5,
    borderRadius: 2.5,
  },
  indicatorActive: {
    backgroundColor: PawColors.black,
  },
  indicatorInactive: {
    backgroundColor: PawColors.black,
    opacity: 0.5,
  },
  heroOverlap: {
    position: 'relative',
    width: '100%',
    marginBottom: 40,
  },
  dogFrame: {
    width: '100%',
    height: 435,
    borderRadius: PawLayout.borderRadiusCard,
    borderWidth: 1,
    borderColor: PawColors.black,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    backgroundColor: PawColors.fieldGray,
  },
  avatarPress: {
    position: 'absolute',
    left: 18,
    bottom: -36,
  },
  avatarOnDog: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: PawColors.black,
  },
  avatarFallback: {
    backgroundColor: PawColors.fieldWhite,
  },
  focusHint: {
    marginTop: -28,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '500',
    color: PawColors.textMuted,
  },
});
