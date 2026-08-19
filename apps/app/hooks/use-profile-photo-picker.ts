import { useCallback, useRef, useState } from 'react';

import { usePawTooltip } from '@/context/paw-tooltip';
import {
  ensureProfilePhotoCameraAccess,
  ensureProfilePhotoLibraryAccess,
  pickProfileImage,
  showProfilePhotoCameraPermissionTooltip,
  showProfilePhotoPermissionTooltip,
  takeProfilePhoto,
  type ProfilePhotoSource,
} from '@/hooks/use-pick-profile-image';

type UseProfilePhotoPickerOptions = {
  aspect?: [number, number];
  allowsEditing?: boolean;
};

export function useProfilePhotoPicker(options: UseProfilePhotoPickerOptions = {}) {
  const { showTooltip } = usePawTooltip();
  const { aspect = [1, 1], allowsEditing = false } = options;
  const [picking, setPicking] = useState(false);
  const [sourceSheetVisible, setSourceSheetVisible] = useState(false);
  const pickingRef = useRef(false);
  const sourceResolverRef = useRef<((source: ProfilePhotoSource | null) => void) | null>(null);

  const waitForSource = useCallback((): Promise<ProfilePhotoSource | null> => {
    return new Promise((resolve) => {
      sourceResolverRef.current = resolve;
      setSourceSheetVisible(true);
    });
  }, []);

  const onSelectSource = useCallback((source: ProfilePhotoSource | null) => {
    setSourceSheetVisible(false);
    const resolve = sourceResolverRef.current;
    sourceResolverRef.current = null;
    resolve?.(source);
  }, []);

  const pickPhoto = useCallback(async (): Promise<string | null> => {
    if (pickingRef.current) return null;

    const source = await waitForSource();
    if (!source) return null;

    pickingRef.current = true;
    setPicking(true);

    try {
      const pickOptions = { aspect, allowsEditing };

      if (source === 'camera') {
        const granted = await ensureProfilePhotoCameraAccess();
        if (!granted) {
          showProfilePhotoCameraPermissionTooltip(showTooltip);
          return null;
        }
        return await takeProfilePhoto(pickOptions);
      }

      const granted = await ensureProfilePhotoLibraryAccess();
      if (!granted) {
        showProfilePhotoPermissionTooltip(showTooltip);
        return null;
      }

      return await pickProfileImage(pickOptions);
    } finally {
      pickingRef.current = false;
      setPicking(false);
    }
  }, [allowsEditing, aspect, showTooltip, waitForSource]);

  return {
    pickPhoto,
    picking,
    sourceSheetVisible,
    onSelectSource,
  };
}
