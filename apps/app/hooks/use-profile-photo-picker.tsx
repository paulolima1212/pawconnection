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
import { prepareProfilePhoto } from '@/lib/apply-profile-crop';

export function useProfilePhotoPicker() {
  const { showTooltip } = usePawTooltip();
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
      if (source === 'camera') {
        const granted = await ensureProfilePhotoCameraAccess();
        if (!granted) {
          showProfilePhotoCameraPermissionTooltip(showTooltip);
          return null;
        }
      } else {
        const granted = await ensureProfilePhotoLibraryAccess();
        if (!granted) {
          showProfilePhotoPermissionTooltip(showTooltip);
          return null;
        }
      }

      const picked = source === 'camera' ? await takeProfilePhoto() : await pickProfileImage();
      if (!picked) return null;

      return prepareProfilePhoto(picked.uri, picked.width, picked.height);
    } finally {
      pickingRef.current = false;
      setPicking(false);
    }
  }, [showTooltip, waitForSource]);

  return {
    pickPhoto,
    picking,
    sourceSheetVisible,
    onSelectSource,
  };
}
