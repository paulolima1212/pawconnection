import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

import { MapProfileMarker } from '@/components/paw/map-profile-marker';
import {
  useDiscoveryMap,
  type DiscoveryMapPermission,
  type MapCoords,
} from '@/hooks/use-discovery-map';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { openUserProfile } from '@/lib/navigation/open-user-profile';
import type { MapUserPinApi } from '@/lib/api/types';

const MAP_HEIGHT = 380;
const DEFAULT_DELTA = 0.04;

type FeedDiscoveryMapProps = {
  active: boolean;
  selfUserId: string | null;
  selfHandle?: string | null;
  selfLabel: string;
  selfPetLabel?: string;
  selfPetPhotoUrl?: string | null;
  selfOwnerPhotoUrl?: string | null;
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
          ? 'Finding your position and nearby pet parents.'
          : 'Allow location so you appear on the map and can see others nearby.'}
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

export function FeedDiscoveryMap({
  active,
  selfUserId,
  selfHandle,
  selfLabel,
  selfPetLabel,
  selfPetPhotoUrl,
  selfOwnerPhotoUrl,
}: FeedDiscoveryMapProps) {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const {
    permission,
    myCoords,
    users,
    usersLoading,
    requestLocationAccess,
  } = useDiscoveryMap(active);

  const others = useMemo(
    () => users.filter((u) => u.id !== selfUserId),
    [users, selfUserId],
  );

  const initialRegion = useMemo(
    () => (myCoords ? regionFromCoords(myCoords) : null),
    [myCoords],
  );

  useEffect(() => {
    if (!active || !myCoords || !mapRef.current) return;
    mapRef.current.animateToRegion(regionFromCoords(myCoords), 600);
  }, [active, myCoords?.latitude, myCoords?.longitude]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Map unavailable on web</Text>
        <Text style={styles.permissionHint}>Open the app on iOS or Android to use the discovery map.</Text>
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

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsMyLocationButton
        showsCompass
        accessibilityLabel="Discovery map">
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
              key={pin.id}
              coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
              petPhotoUrl={pin.petPhotoUrl}
              ownerPhotoUrl={pin.photoUrl}
              variant="other"
              accessibilityLabel={`${label}, tap to open profile`}
              onPress={() => openUserProfile(router, pin.handle)}
            />
          );
        })}
      </MapView>
      {usersLoading && others.length === 0 ? (
        <View style={styles.mapOverlay} pointerEvents="none">
          <ActivityIndicator color={PawColors.whiteCard} />
        </View>
      ) : null}
      <Text style={styles.mapCaption}>
        {others.length === 0
          ? 'You are on the map. Other pet parents appear here while their app is open; when closed, their last known spot is shown.'
          : `${others.length} pet parent${others.length === 1 ? '' : 's'} nearby — tap a photo to open their profile.`}
      </Text>
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
