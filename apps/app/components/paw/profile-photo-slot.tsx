import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfilePhotosLightbox } from '@/components/paw/profile-photos-lightbox';
import { ProfilePhotoSourceSheet } from '@/components/paw/profile-photo-source-sheet';
import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import { useProfilePhotoPicker } from '@/hooks/use-profile-photo-picker';
import { resolveMediaDisplayUrl, resolveMediaUrl } from '@/lib/api/media';

type ProfilePhotoSlotProps = {
  imageUri: string | null;
  onImageChange: (uri: string | null) => void;
  /** [4,3] para área mais larga; padrão 1:1 */
  aspect?: [number, number];
  iconVariant?: 'human' | 'dog';
};

export function ProfilePhotoSlot({
  imageUri,
  onImageChange,
  aspect = [1, 1],
}: ProfilePhotoSlotProps) {
  const { pickPhoto, picking, sourceSheetVisible, onSelectSource } = useProfilePhotoPicker({
    aspect,
    allowsEditing: true,
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const displayUri = useMemo(() => {
    const resolved = resolveMediaDisplayUrl(imageUri) ?? resolveMediaUrl(imageUri);
    if (resolved) return resolved;
    if (imageUri?.startsWith('file://') || imageUri?.startsWith('content://')) {
      return imageUri;
    }
    return null;
  }, [imageUri]);
  const hasPhoto = Boolean(displayUri);

  const onPick = async () => {
    const uri = await pickPhoto();
    if (uri) onImageChange(uri);
  };

  const openLightbox = () => {
    if (hasPhoto && displayUri) setLightboxOpen(true);
  };

  return (
    <View style={styles.upload}>
      <ProfilePhotoSourceSheet
        visible={sourceSheetVisible}
        disabled={picking}
        onClose={() => onSelectSource(null)}
        onTakePhoto={() => onSelectSource('camera')}
        onChooseLibrary={() => onSelectSource('library')}
      />

      {hasPhoto && displayUri ? (
        <>
          <Pressable
            onPress={openLightbox}
            style={({ pressed }) => [styles.previewPress, pressed && styles.uploadPressed]}
            accessibilityRole="imagebutton"
            accessibilityLabel="View photo full screen">
            <RemoteMediaImage uri={displayUri} style={styles.preview} contentFit="cover" />
          </Pressable>
          <Pressable
            onPress={() => void onPick()}
            disabled={picking}
            style={({ pressed }) => [
              styles.cameraBtn,
              (pressed || picking) && styles.cameraBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Choose a new photo"
            accessibilityHint="Opens camera or photo library options">
            {picking ? (
              <ActivityIndicator size="small" color={PawColors.fieldWhite} />
            ) : (
              <Feather name="camera" size={18} color={PawColors.fieldWhite} />
            )}
          </Pressable>
          <ProfilePhotosLightbox
            visible={lightboxOpen}
            photos={[{ uri: displayUri }]}
            onClose={() => setLightboxOpen(false)}
          />
        </>
      ) : (
        <Pressable
          onPress={() => void onPick()}
          disabled={picking}
          style={({ pressed }) => [styles.emptyState, pressed && styles.uploadPressed]}
          accessibilityRole="button"
          accessibilityLabel="Choose profile photo"
          accessibilityHint="Opens camera or photo library options">
          <View style={styles.uploadIconStack}>
            <View style={styles.uploadCircle}>
              {picking ? (
                <ActivityIndicator size="small" color={PawColors.checkboxLavender} />
              ) : (
                <Feather name="upload-cloud" size={28} color={PawColors.checkboxLavender} />
              )}
            </View>
          </View>
          <Text style={styles.uploadBold}>Click to upload</Text>
          <Text style={styles.uploadHint}>JPG, PNG or GIF</Text>
          <View style={styles.cameraBtnEmpty}>
            <Feather name="camera" size={20} color={PawColors.fieldWhite} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  upload: {
    marginTop: 14,
    backgroundColor: PawColors.fieldGray,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    minHeight: 158,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadPressed: {
    opacity: 0.92,
  },
  previewPress: {
    width: '100%',
    minHeight: 158,
  },
  preview: {
    width: '100%',
    minHeight: 158,
    borderRadius: PawLayout.borderRadiusField - 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    minHeight: 158,
  },
  uploadIconStack: {
    width: 55,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: PawColors.reactionLavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBold: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '700',
    color: PawColors.textSecondary,
  },
  uploadHint: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cameraBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: PawColors.black,
    backgroundColor: PawColors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cameraBtnEmpty: {
    marginTop: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: PawColors.black,
    backgroundColor: PawColors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtnPressed: {
    opacity: 0.88,
  },
});
