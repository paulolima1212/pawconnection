import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

import { ProfilePhotoSourceSheet } from '@/components/paw/profile-photo-source-sheet';
import { ProfilePhotosLightbox } from '@/components/paw/profile-photos-lightbox';
import type { ProfileInfoTab } from '@/components/paw/profile-info-switch';
import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PROFILE_FIGMA } from '@/constants/profile-figma-assets';
import { PawColors, PawFontSize, PawLineHeight } from '@/constants/paw-styles';
import { useProfilePhotoPicker } from '@/hooks/use-profile-photo-picker';
import { resolveMediaDisplayUrl, resolveMediaUrl } from '@/lib/api/media';

export type ProfilePhotoField = 'dog' | 'human';

type ProfileAvatarStackProps = {
  activeTab: ProfileInfoTab;
  dogName: string;
  ownerName: string;
  ownerFullName: string;
  dogPhotoUri: string | null;
  humanPhotoUri: string | null;
  photoUploading?: boolean;
  onPhotoChange: (field: ProfilePhotoField, uri: string) => void;
};

export function ProfileAvatarStack({
  activeTab,
  dogName,
  ownerName,
  ownerFullName,
  dogPhotoUri,
  humanPhotoUri,
  photoUploading = false,
  onPhotoChange,
}: ProfileAvatarStackProps) {
  if (activeTab === 'pet') {
    return (
      <ProfileEditPhoto
        field="dog"
        name={dogName}
        subtitle="Pet profile"
        photoUri={dogPhotoUri}
        fallback={PROFILE_FIGMA.dogAvatar}
        showVerifiedBadge
        uploading={photoUploading}
        onPhotoChange={onPhotoChange}
        accessibilityLabel="View dog photo full screen"
        pickAccessibilityLabel="Change dog photo"
      />
    );
  }

  return (
    <ProfileEditPhoto
      field="human"
      name={ownerFullName.trim() || ownerName}
      subtitle="Owner profile"
      photoUri={humanPhotoUri}
      fallback={PROFILE_FIGMA.humanAvatar}
      uploading={photoUploading}
      onPhotoChange={onPhotoChange}
      accessibilityLabel="View owner photo full screen"
      pickAccessibilityLabel="Change owner photo"
    />
  );
}

type ProfileEditPhotoProps = {
  field: ProfilePhotoField;
  name: string;
  subtitle: string;
  photoUri: string | null;
  fallback: number;
  showVerifiedBadge?: boolean;
  uploading?: boolean;
  onPhotoChange: (field: ProfilePhotoField, uri: string) => void;
  accessibilityLabel: string;
  pickAccessibilityLabel: string;
};

function ProfileEditPhoto({
  field,
  name,
  subtitle,
  photoUri,
  fallback,
  showVerifiedBadge = false,
  uploading = false,
  onPhotoChange,
  accessibilityLabel,
  pickAccessibilityLabel,
}: ProfileEditPhotoProps) {
  const { pickPhoto, picking, sourceSheetVisible, onSelectSource } = useProfilePhotoPicker({
    aspect: [1, 1],
    allowsEditing: false,
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const displayUri = useMemo(() => {
    const resolved = resolveMediaDisplayUrl(photoUri) ?? resolveMediaUrl(photoUri);
    if (resolved) return resolved;
    if (photoUri?.startsWith('file://') || photoUri?.startsWith('content://')) {
      return photoUri;
    }
    return null;
  }, [photoUri]);
  const hasPhoto = Boolean(displayUri);

  const handlePick = () => {
    const targetField = field;
    void (async () => {
      const uri = await pickPhoto();
      if (uri) onPhotoChange(targetField, uri);
    })();
  };

  const openLightbox = () => {
    if (hasPhoto && displayUri) setLightboxOpen(true);
  };

  return (
    <View style={styles.root}>
      <ProfilePhotoSourceSheet
        visible={sourceSheetVisible}
        disabled={picking || uploading}
        onClose={() => onSelectSource(null)}
        onTakePhoto={() => onSelectSource('camera')}
        onChooseLibrary={() => onSelectSource('library')}
      />
      <View style={styles.singleArea} pointerEvents="box-none">
        <Pressable
          onPress={openLightbox}
          disabled={!hasPhoto}
          style={({ pressed }) => [
            styles.photoPressable,
            hasPhoto && pressed && styles.photoPressablePressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={
            hasPhoto ? 'Opens the photo in full screen' : 'Add a photo with the camera button'
          }>
          <View style={styles.largeRing} pointerEvents="none">
            {hasPhoto && displayUri ? (
              <RemoteMediaImage
                uri={displayUri}
                style={styles.largePhoto}
                contentFit="cover"
                recyclingKey={`${field}-${displayUri}`}
              />
            ) : (
              <Image
                source={fallback}
                style={styles.largePhoto}
                contentFit="cover"
                transition={120}
              />
            )}
          </View>
        </Pressable>

        {showVerifiedBadge ? (
          <View style={styles.verifiedBadge} pointerEvents="none" accessibilityLabel="Verified profile">
            <View style={styles.verifiedInner}>
              <Feather name="check" size={14} color={PawColors.profileBrown} />
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={handlePick}
          disabled={picking || uploading}
          hitSlop={8}
          style={({ pressed }) => [
            styles.peachCameraBtnSingle,
            (pressed || picking || uploading) && styles.cameraBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={pickAccessibilityLabel}
          accessibilityHint="Take a photo or choose one from your library">
          {picking || uploading ? (
            <ActivityIndicator size="small" color={PawColors.fieldWhite} />
          ) : (
            <Feather name="camera" size={14} color={PawColors.fieldWhite} />
          )}
        </Pressable>
      </View>
      <Text style={styles.dogTitle}>{name}</Text>
      <Text style={styles.ownerSubtitle}>{subtitle}</Text>

      {displayUri ? (
        <ProfilePhotosLightbox
          visible={lightboxOpen}
          photos={[{ uri: displayUri, label: name }]}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    width: '100%',
  },
  singleArea: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    position: 'relative',
  },
  photoPressable: {
    alignSelf: 'center',
    borderRadius: 54,
  },
  photoPressablePressed: {
    opacity: 0.92,
  },
  largeRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: PawColors.black,
    padding: 4,
    overflow: 'hidden',
    backgroundColor: PawColors.fieldWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  largePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
  },
  verifiedBadge: {
    position: 'absolute',
    right: 0,
    top: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
    padding: 4,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  verifiedInner: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: PawColors.reactionLavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peachCameraBtnSingle: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: PawColors.black,
    backgroundColor: PawColors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
  },
  cameraBtnPressed: {
    opacity: 0.88,
  },
  dogTitle: {
    marginTop: 8,
    fontSize: PawFontSize.profileName,
    lineHeight: PawLineHeight.profileName + 6,
    fontWeight: '700',
    color: PawColors.profileBrown,
    textAlign: 'center',
  },
  ownerSubtitle: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: PawColors.chipGray,
    textAlign: 'center',
  },
});
