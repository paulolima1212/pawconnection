/**
 * Profile photos are cropped by the system gallery editor, then reduced
 * before upload. The API rejects files larger than 5 MB.
 */
export const PROFILE_PHOTO_MAX_EDGE = 1080;
export const PROFILE_PHOTO_JPEG_QUALITY = 0.8;

/** Native gallery/camera crop. Square frame, circular window, matching the avatar. */
export const NATIVE_PROFILE_CROP = {
  allowsEditing: true,
  aspect: [1, 1] as [number, number],
  shape: 'oval' as const,
};

export type ProfilePhotoResize =
  | { resize: { width: number } }
  | { resize: { height: number } };

/** Shrink the long edge. Images already within the limit are left as-is. */
export function profilePhotoResizeAction(
  width: number,
  height: number,
): ProfilePhotoResize | null {
  if (width <= 0 || height <= 0) return { resize: { width: PROFILE_PHOTO_MAX_EDGE } };
  const longest = Math.max(width, height);
  if (longest <= PROFILE_PHOTO_MAX_EDGE) return null;
  if (width >= height) return { resize: { width: PROFILE_PHOTO_MAX_EDGE } };
  return { resize: { height: PROFILE_PHOTO_MAX_EDGE } };
}

/** A photo change updates only the picture. Other profile fields stay untouched. */
export function profilePhotoPatch(photoUrl: string): { photoUrl: string } {
  return { photoUrl };
}
