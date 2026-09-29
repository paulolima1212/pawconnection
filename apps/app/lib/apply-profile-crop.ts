import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import type { CropRect } from '@/lib/image-crop';
import {
  PROFILE_PHOTO_JPEG_QUALITY,
  profilePhotoResizeAction,
} from '@/lib/profile-photo';

/** Shrink and re-encode the gallery crop so the upload stays small and fast. */
export async function prepareProfilePhoto(
  uri: string,
  width: number,
  height: number,
): Promise<string> {
  const resize = profilePhotoResizeAction(width, height);
  const result = await manipulateAsync(uri, resize ? [resize] : [], {
    compress: PROFILE_PHOTO_JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });
  return result.uri;
}

/** Write the exact square the user framed. The saved file has no extra crop. */
export async function exportProfileCrop(uri: string, crop: CropRect): Promise<string> {
  const result = await manipulateAsync(uri, [{ crop }], {
    compress: 0.85,
    format: SaveFormat.JPEG,
  });
  return result.uri;
}
