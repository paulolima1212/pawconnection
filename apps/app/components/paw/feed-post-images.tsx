import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { FeedImageLightbox } from '@/components/paw/feed-image-lightbox';
import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PawColors, PawLayout } from '@/constants/paw-styles';
import { useContentWidth } from '@/hooks/use-content-width';
import { resolvePostImageUrls } from '@/lib/api/media';

type FeedPostImagesProps = {
  imageUrls: string[];
};

export function FeedPostImages({ imageUrls }: FeedPostImagesProps) {
  const urls = useMemo(() => resolvePostImageUrls(imageUrls), [imageUrls]);
  const contentWidth = useContentWidth();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const photoStyle = { width: contentWidth, height: contentWidth };
  const bleedStyle = [styles.bleed, { width: contentWidth }];

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
          style={bleedStyle}
          accessibilityRole="imagebutton"
          accessibilityLabel="View post photo full screen">
          <RemoteMediaImage uri={urls[0]} style={[styles.photo, photoStyle]} contentFit="cover" />
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
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={bleedStyle}>
        {urls.map((uri, index) => (
          <Pressable
            key={`${uri}-${index}`}
            onPress={() => openAt(index)}
            accessibilityRole="imagebutton"
            accessibilityLabel={`View photo ${index + 1} of ${urls.length} full screen`}>
            <RemoteMediaImage uri={uri} style={[styles.photo, photoStyle]} contentFit="cover" />
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
  bleed: {
    marginHorizontal: -PawLayout.horizontalPadding,
  },
  photo: {
    backgroundColor: PawColors.fieldGray,
  },
});
