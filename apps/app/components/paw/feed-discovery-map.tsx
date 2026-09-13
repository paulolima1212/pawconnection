import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

import { MapPlaceMarker } from '@/components/paw/map-place-marker';
import { MapProfileMarker } from '@/components/paw/map-profile-marker';
import {
  MAP_PLACE_FILTER_OPTIONS,
  type MapPlaceFilter,
} from '@/constants/map-place-filters';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import {
  useDiscoveryMap,
  type DiscoveryMapPermission,
  type MapCoords,
} from '@/hooks/use-discovery-map';
import { useDogFriendlyPlaces } from '@/hooks/use-dog-friendly-places';
import type { MapPlacePinApi } from '@/lib/api/types';
import { openUserProfile } from '@/lib/navigation/open-user-profile';

const MAP_HEIGHT = 380;
const DEFAULT_DELTA = 0.04;

const CATEGORY_LABEL: Record<MapPlacePinApi['category'], string> = {
  parks: 'Park',
  services: 'Dog service',
  cafes: 'Dog-friendly café',
};

type FeedDiscoveryMapProps = {
  active: boolean;
  selfUserId: string | null;
  selfHandle?: string | null;
  selfLabel: string;
  selfPetLabel?: string;
  selfPetPhotoUrl?: string | null;
  selfOwnerPhotoUrl?: string | null;
  radiusKm: string;
  placeCategory: MapPlaceFilter;
};

function regionFromCoords(coords: MapCoords) {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  };
}

function MapPermissionCard({
  permission,
  onRequest,
}: {
  permission: DiscoveryMapPermission;
  onRequest: () => void;
}) {
  const isLoading = permission === 'loading';
  return (
    <View style={styles.permissionCard}>
      <Text style={styles.permissionTitle}>
        {isLoading ? 'Loading map…' : 'Location access needed'}
      </Text>
      <Text style={styles.permissionHint}>
        {isLoading
          ? 'Finding your position and nearby dog-friendly places.'
          : 'Allow location so we can show dog-friendly parks, services, and cafés near you.'}
      </Text>
      {!isLoading ? (
        <Pressable
          style={styles.permissionButton}
          onPress={onRequest}
          accessibilityRole="button"
          accessibilityLabel="Enable location for map">
          <Text style={styles.permissionButtonText}>Enable location</Text>
        </Pressable>
      ) : (
        <ActivityIndicator color={PawColors.navLabelActive} style={styles.spinner} />
      )}
    </View>
  );
}

async function openPlaceInMaps(place: MapPlacePinApi) {
  const query = encodeURIComponent(
    place.address ? `${place.name} ${place.address}` : `${place.latitude},${place.longitude}`,
  );
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  await Linking.openURL(url);
}

export function FeedDiscoveryMap({
  active,
  selfUserId,
  selfHandle,
  selfLabel,
  selfPetLabel,
  selfPetPhotoUrl,
  selfOwnerPhotoUrl,
  radiusKm,
  placeCategory,
}: FeedDiscoveryMapProps) {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<MapPlacePinApi | null>(null);
  const {
    permission,
    myCoords,
    users,
    usersLoading,
    requestLocationAccess,
  } = useDiscoveryMap(active);
  const { places, loading: placesLoading, appliedRadiusKm } = useDogFriendlyPlaces({
    enabled: active && permission === 'ready',
    coords: myCoords,
    radiusKm,
    category: placeCategory,
  });

  const others = useMemo(
    () => users.filter((u) => u.id !== selfUserId),
    [users, selfUserId],
  );

  const initialRegion = useMemo(
    () => (myCoords ? regionFromCoords(myCoords) : null),
    [myCoords],
  );

  useEffect(() => {
    setSelectedPlace(null);
  }, [placeCategory, radiusKm]);

  useEffect(() => {
    if (!active || !myCoords || !mapRef.current) return;
    mapRef.current.animateToRegion(regionFromCoords(myCoords), 600);
  }, [active, myCoords?.latitude, myCoords?.longitude]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Map unavailable on web</Text>
        <Text style={styles.permissionHint}>
          Open the app on iOS or Android to see dog-friendly places on the map.
        </Text>
      </View>
    );
  }

  if (permission !== 'ready' || !myCoords || !initialRegion) {
    return (
      <MapPermissionCard
        permission={permission}
        onRequest={() => void requestLocationAccess()}
      />
    );
  }

  const selfTitle = selfPetLabel?.trim() || selfLabel;
  const filterLabel =
    MAP_PLACE_FILTER_OPTIONS.find((o) => o.value === placeCategory)?.label ?? 'For you';
  const radiusLabel = `${appliedRadiusKm ?? 5} km`;
  const overlayLoading = (placesLoading && places.length === 0) || (usersLoading && others.length === 0);

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsMyLocationButton
        showsCompass
        accessibilityLabel="Dog-friendly places map">
        <MapProfileMarker
          coordinate={myCoords}
          petPhotoUrl={selfPetPhotoUrl}
          ownerPhotoUrl={selfOwnerPhotoUrl}
          variant="self"
          accessibilityLabel={`You on the map, ${selfTitle}`}
          onPress={() => openUserProfile(router, selfHandle)}
        />
        {others.map((pin) => {
          const label = pin.petName?.trim() || pin.fullName;
          return (
            <MapProfileMarker
              key={`user-${pin.id}`}
              coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
              petPhotoUrl={pin.petPhotoUrl}
              ownerPhotoUrl={pin.photoUrl}
              variant="other"
              accessibilityLabel={`${label}, tap to open profile`}
              onPress={() => openUserProfile(router, pin.handle)}
            />
          );
        })}
        {places.map((place) => (
          <MapPlaceMarker
            key={`place-${place.id}`}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            category={place.category}
            featured={place.featured}
            accessibilityLabel={`${place.name}, ${CATEGORY_LABEL[place.category]}`}
            onPress={() => setSelectedPlace(place)}
          />
        ))}
      </MapView>
      {overlayLoading ? (
        <View style={styles.mapOverlay} pointerEvents="none">
          <ActivityIndicator color={PawColors.whiteCard} />
        </View>
      ) : null}

      {selectedPlace ? (
        <Pressable
          style={styles.placeCard}
          onPress={() => void openPlaceInMaps(selectedPlace)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${selectedPlace.name} in maps`}>
          <Text style={styles.placeName}>{selectedPlace.name}</Text>
          <Text style={styles.placeMeta}>
            {CATEGORY_LABEL[selectedPlace.category]}
            {selectedPlace.featured ? ' · suggested for you' : ''}
            {` · ${selectedPlace.distanceKm} km`}
          </Text>
          {selectedPlace.address ? (
            <Text style={styles.placeAddress}>{selectedPlace.address}</Text>
          ) : null}
          <Text style={styles.placeAction}>Open in Maps</Text>
        </Pressable>
      ) : (
        <Text style={styles.mapCaption}>
          {places.length === 0
            ? `No dog-friendly ${filterLabel.toLowerCase()} within ${radiusLabel} yet. Try a wider distance.`
            : `${places.length} dog-friendly place${places.length === 1 ? '' : 's'} within ${radiusLabel}. Pins with a peach fill match your profile.`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    gap: 8,
  },
  map: {
    width: '100%',
    height: MAP_HEIGHT,
    borderRadius: PawLayout.borderRadiusCard,
    borderWidth: 1,
    borderColor: PawColors.black,
    overflow: 'hidden',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    height: MAP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: PawLayout.borderRadiusCard,
  },
  mapCaption: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.textMuted,
    lineHeight: 18,
  },
  placeCard: {
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusCard,
    backgroundColor: PawColors.whiteCard,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  placeName: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.black,
  },
  placeMeta: {
    fontSize: PawFontSize.caption,
    fontWeight: '400',
    color: PawColors.profileBrown,
  },
  placeAddress: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.textMuted,
  },
  placeAction: {
    marginTop: 4,
    fontSize: PawFontSize.caption,
    fontWeight: '700',
    color: PawColors.black,
  },
  permissionCard: {
    marginTop: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: PawLayout.borderRadiusCard,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.whiteCard,
    alignItems: 'center',
    gap: 10,
  },
  permissionTitle: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.black,
    textAlign: 'center',
  },
  permissionHint: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textMuted,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.peachBorder,
  },
  permissionButtonText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  spinner: {
    marginTop: 8,
  },
});
