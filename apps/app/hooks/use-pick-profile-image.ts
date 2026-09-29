import * as ImagePicker from 'expo-image-picker';
import { Linking, Platform } from 'react-native';

import type { PawTooltipOptions } from '@/components/paw/paw-tooltip';
import { NATIVE_PROFILE_CROP } from '@/lib/profile-photo';

export type PickedProfileImage = {
  uri: string;
  width: number;
  height: number;
};

export type ProfilePhotoSource = 'camera' | 'library';

const IMAGE_PICKER_OPTIONS = {
  mediaTypes: ['images'] as ImagePicker.MediaType[],
  quality: 0.8,
  exif: false,
  ...NATIVE_PROFILE_CROP,
};

export async function getProfilePhotoLibraryAccess(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  return current.granted;
}

export async function ensureProfilePhotoLibraryAccess(): Promise<boolean> {
  if (await getProfilePhotoLibraryAccess()) return true;

  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (!current.canAskAgain) return false;

  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

export async function getProfilePhotoCameraAccess(): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  return current.granted;
}

export async function ensureProfilePhotoCameraAccess(): Promise<boolean> {
  if (await getProfilePhotoCameraAccess()) return true;

  const current = await ImagePicker.getCameraPermissionsAsync();
  if (!current.canAskAgain) return false;

  const requested = await ImagePicker.requestCameraPermissionsAsync();
  return requested.granted;
}

export function showProfilePhotoPermissionTooltip(
  showTooltip: (options: PawTooltipOptions) => void,
) {
  showTooltip({
    title: 'Photo access needed',
    message: 'Allow photo library access to change your profile picture.',
    variant: 'info',
    durationMs: 6000,
    action:
      Platform.OS === 'ios'
        ? { label: 'Open Settings', onPress: () => Linking.openSettings() }
        : undefined,
  });
}

export function showProfilePhotoCameraPermissionTooltip(
  showTooltip: (options: PawTooltipOptions) => void,
) {
  showTooltip({
    title: 'Camera access needed',
    message: 'Allow camera access to take a profile picture.',
    variant: 'info',
    durationMs: 6000,
    action:
      Platform.OS === 'ios'
        ? { label: 'Open Settings', onPress: () => Linking.openSettings() }
        : undefined,
  });
}

/** @deprecated Use `showProfilePhotoPermissionTooltip` with `usePawTooltip()`. */
export const showProfilePhotoPermissionAlert = showProfilePhotoPermissionTooltip;

function pickedFromAsset(
  asset: ImagePicker.ImagePickerAsset | undefined,
): PickedProfileImage | null {
  if (!asset?.uri) return null;
  return {
    uri: asset.uri,
    width: asset.width > 0 ? asset.width : 1,
    height: asset.height > 0 ? asset.height : 1,
  };
}

/** Opens the gallery when permission is already granted, then the system crop editor. */
export async function pickProfileImage(): Promise<PickedProfileImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    ...IMAGE_PICKER_OPTIONS,
    selectionLimit: 1,
  });

  if (result.canceled) return null;
  return pickedFromAsset(result.assets[0]);
}

/** Opens the camera when permission is already granted, then the system crop editor. */
export async function takeProfilePhoto(): Promise<PickedProfileImage | null> {
  const result = await ImagePicker.launchCameraAsync({
    ...IMAGE_PICKER_OPTIONS,
  });

  if (result.canceled) return null;
  return pickedFromAsset(result.assets[0]);
}
