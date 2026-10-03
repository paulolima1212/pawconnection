import { useCallback, useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { PawColors } from '@/constants/paw-styles';
import { resolveMediaDisplayUrl } from '@/lib/api/media';
import type { MapCoords } from '@/hooks/use-discovery-map';

const MARKER_SIZE = 46;
/** Stop snapshotting even if the image never finishes, so Android does not crash. */
const TRACKING_FALLBACK_MS = 800;
const DEFAULT_PET_AVATAR =
  'https://www.figma.com/api/mcp/asset/ddcd8fa6-d1af-4e2f-9d65-23d82344bad6';
export type MapProfileMarkerProps = {
  coordinate: MapCoords;
  petPhotoUrl?: string | null;
  ownerPhotoUrl?: string | null;
  variant?: 'self' | 'other';
  onPress?: () => void;
  accessibilityLabel: string;
};

function resolveMarkerPhoto(
  petPhotoUrl?: string | null,
  ownerPhotoUrl?: string | null,
): string {
  return (
    resolveMediaDisplayUrl(petPhotoUrl ?? null) ??
    resolveMediaDisplayUrl(ownerPhotoUrl ?? null) ??
    DEFAULT_PET_AVATAR
  );
}

export function MapProfileMarker({
  coordinate,
  petPhotoUrl,
  ownerPhotoUrl,
  variant = 'other',
  onPress,
  accessibilityLabel,
}: MapProfileMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(Platform.OS === 'android');
  const photoUri = resolveMarkerPhoto(petPhotoUrl, ownerPhotoUrl);
  const ringStyle = variant === 'self' ? styles.ringSelf : styles.ringOther;

  const stopTracking = useCallback(() => {
    setTracksViewChanges(false);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    setTracksViewChanges(true);
    const timer = setTimeout(stopTracking, TRACKING_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [photoUri, stopTracking]);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}>
      <View style={styles.hit} collapsable={false}>
        <View style={[styles.ring, ringStyle]} collapsable={false}>
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            resizeMode="cover"
            fadeDuration={0}
            onLoad={stopTracking}
            onError={stopTracking}
          />
        </View>
        <View style={[styles.pointer, variant === 'self' ? styles.pointerSelf : styles.pointerOther]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignItems: 'center',
  },
  ring: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: PawColors.whiteCard,
  },
  ringSelf: {
    borderColor: PawColors.peachBorder,
  },
  ringOther: {
    borderColor: PawColors.badgeBlue,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  pointer: {
    width: 10,
    height: 10,
    marginTop: -5,
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  pointerSelf: {
    backgroundColor: PawColors.peachBorder,
    borderColor: PawColors.black,
  },
  pointerOther: {
    backgroundColor: PawColors.badgeBlue,
    borderColor: PawColors.black,
  },
});
