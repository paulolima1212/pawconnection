import { Image, type ImageContentFit } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, type StyleProp, type ImageStyle } from 'react-native';

import { PawColors } from '@/constants/paw-styles';
import {
  resolveMediaDisplayFallback,
  resolveMediaDisplayUrl,
} from '@/lib/api/media';

type RemoteMediaImageProps = {
  uri: string | null | undefined;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  recyclingKey?: string;
  transition?: number;
};

export function RemoteMediaImage({
  uri,
  style,
  contentFit = 'cover',
  recyclingKey,
  transition = 120,
}: RemoteMediaImageProps) {
  const primary = useMemo(() => resolveMediaDisplayUrl(uri), [uri]);
  const fallback = useMemo(() => resolveMediaDisplayFallback(uri), [uri]);
  const [src, setSrc] = useState(primary);

  useEffect(() => {
    setSrc(primary);
  }, [primary]);

  if (!primary) {
    return <Image style={[styles.placeholder, style]} contentFit={contentFit} />;
  }

  const displayUri = src ?? primary;

  return (
    <Image
      source={{ uri: displayUri }}
      style={style}
      contentFit={contentFit}
      recyclingKey={recyclingKey ?? displayUri}
      transition={transition}
      onError={() => {
        if (fallback && displayUri !== fallback) {
          setSrc(fallback);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: PawColors.fieldGray,
  },
});
