import { ProfilePhotosLightbox, type ProfilePhotoSlide } from '@/components/paw/profile-photos-lightbox';

type FeedImageLightboxProps = {
  visible: boolean;
  urls: string[];
  initialIndex?: number;
  onClose: () => void;
};

/** Full-screen gallery for post images (centered, swipeable). */
export function FeedImageLightbox({
  visible,
  urls,
  initialIndex = 0,
  onClose,
}: FeedImageLightboxProps) {
  const photos: ProfilePhotoSlide[] = urls.map((uri) => ({ uri }));
  return (
    <ProfilePhotosLightbox
      visible={visible}
      photos={photos}
      initialIndex={initialIndex}
      onClose={onClose}
    />
  );
}
