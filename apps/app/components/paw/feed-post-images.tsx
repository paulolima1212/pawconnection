import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { FeedImageLightbox } from '@/components/paw/feed-image-lightbox';
import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PawColors } from '@/constants/paw-styles';
import { resolvePostImageUrls } from '@/lib/api/media';

type FeedPostImagesProps = {
  imageUrls: string[];
};

export function FeedPostImages({ imageUrls }: FeedPostImagesProps) {
  const urls = useMemo(() => resolvePostImageUrls(imageUrls), [imageUrls]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!urls.length) return null;

  const openAt = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (urls.length === 1) {
    return (
      <>
        <Pressable
          onPress={() => openAt(0)}
          accessibilityRole="imagebutton"
          accessibilityLabel="View post photo full screen">
          <RemoteMediaImage uri={urls[0]} style={styles.single} contentFit="cover" />
        </Pressable>
        <FeedImageLightbox
          visible={lightboxOpen}
          urls={urls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={styles.row}>
        {urls.map((uri, index) => (
          <Pressable
            key={`${uri}-${index}`}
            onPress={() => openAt(index)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`View photo ${index + 1} of ${urls.length} full screen`}>
            <RemoteMediaImage uri={uri} style={styles.thumb} contentFit="cover" />
          </Pressable>
        ))}
      </ScrollView>
      <FeedImageLightbox
        visible={lightboxOpen}
        urls={urls}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  single: {
    alignSelf: 'stretch',
    width: '100%',
    height: 220,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
  row: {
    gap: 8,
  },
  thumb: {
    width: 160,
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
});
