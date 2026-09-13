import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { useCallback, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { PawColors } from '@/constants/paw-styles';
import type { MapPlaceCategory } from '@/constants/map-place-filters';
import type { MapCoords } from '@/hooks/use-discovery-map';

const ICON_BY_CATEGORY: Record<MapPlaceCategory, ComponentProps<typeof Feather>['name']> = {
  parks: 'sun',
  services: 'briefcase',
  cafes: 'coffee',
};

type MapPlaceMarkerProps = {
  coordinate: MapCoords;
  category: MapPlaceCategory;
  featured?: boolean;
  accessibilityLabel: string;
  onPress?: () => void;
};

export function MapPlaceMarker({
  coordinate,
  category,
  featured = false,
  accessibilityLabel,
  onPress,
}: MapPlaceMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(Platform.OS === 'android');
  const stopTracking = useCallback(() => setTracksViewChanges(false), []);
  const pinTone = {
    parks: styles.pinParks,
    services: styles.pinServices,
    cafes: styles.pinCafes,
  };

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
      onLayout={stopTracking}
      accessibilityLabel={accessibilityLabel}>
      <View style={[styles.pin, featured && styles.pinFeatured, pinTone[category]]}>
        <Feather name={ICON_BY_CATEGORY[category]} size={16} color={PawColors.black} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: PawColors.black,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PawColors.whiteCard,
  },
  pinFeatured: {
    borderWidth: 3,
    backgroundColor: PawColors.peachBorder,
  },
  pinParks: {
    backgroundColor: PawColors.whiteCard,
  },
  pinServices: {
    backgroundColor: PawColors.profileTipBg,
  },
  pinCafes: {
    backgroundColor: PawColors.fieldWhite,
  },
});
