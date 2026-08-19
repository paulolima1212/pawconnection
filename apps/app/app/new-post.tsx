import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareFormScroll } from '@/components/paw/keyboard-aware-form-scroll';
import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import { useFeedPosts } from '@/context/feed-posts';
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import { useProfileOnboarding } from '@/context/profile-onboarding';
import { ApiError } from '@/lib/api/client';
import * as feedApi from '@/lib/api/feed';
import { mergeAuthorPhotoSources } from '@/lib/feed-post-author';
import {
  ensureProfilePhotoLibraryAccess,
  showProfilePhotoPermissionTooltip,
} from '@/hooks/use-pick-profile-image';
import { isHttpUrl, resolveMediaDisplayUrl, resolveRemoteUri } from '@/lib/api/media';

const IMG_DOG_FALLBACK = 'https://www.figma.com/api/mcp/asset/ddcd8fa6-d1af-4e2f-9d65-23d82344bad6';
const IMG_HUMAN_FALLBACK = 'https://www.figma.com/api/mcp/asset/c1ef6353-145d-4fed-a0e3-a4543af4c7bb';

const MAX_PHOTOS = 8;

export default function NewPostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifyPostCreated } = useFeedPosts();
  const { draft, syncOwnerToApi, syncPetToApi } = useProfileOnboarding();
  const { showTooltip } = usePawTooltip();

  const [body, setBody] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [pickingPhotos, setPickingPhotos] = useState(false);
  const pickingRef = useRef(false);

  const dogName = draft.dogName.trim() || 'Pluto';
  const humanFirst =
    draft.fullName.trim().split(/\s+/)[0] || draft.fullName.trim() || 'Jefferson';
  const dogPhoto = useMemo(
    () => resolveMediaDisplayUrl(draft.dogPhotoUri) ?? IMG_DOG_FALLBACK,
    [draft.dogPhotoUri],
  );
  const humanPhoto = useMemo(
    () => resolveMediaDisplayUrl(draft.humanPhotoUri) ?? IMG_HUMAN_FALLBACK,
    [draft.humanPhotoUri],
  );

  const canPublish = useMemo(() => body.trim().length > 0 || imageUris.length > 0, [body, imageUris.length]);

  const pickGalleryImages = useCallback(
    async (existing: number): Promise<string[]> => {
      const remaining = MAX_PHOTOS - existing;
      if (remaining <= 0) return [];

      const granted = await ensureProfilePhotoLibraryAccess();
      if (!granted) {
        showProfilePhotoPermissionTooltip(showTooltip);
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.85,
        exif: false,
      });

      if (result.canceled) return [];
      return result.assets.map((a) => a.uri).filter(Boolean) as string[];
    },
    [showTooltip],
  );

  const onAddPhotos = useCallback(async () => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    setPickingPhotos(true);
    Keyboard.dismiss();
    try {
      const picked = await pickGalleryImages(imageUris.length);
      if (picked.length) {
        setImageUris((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
      }
    } finally {
      pickingRef.current = false;
      setPickingPhotos(false);
    }
  }, [imageUris.length, pickGalleryImages]);

  const onRemovePhoto = useCallback((index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onPublish = useCallback(async () => {
    if (!canPublish || publishing) return;
    setPublishing(true);
    try {
      let profileAfterSync: Awaited<ReturnType<typeof syncPetToApi>> | undefined;
      if (draft.dogPhotoUri) {
        profileAfterSync = await syncPetToApi();
      }
      if (draft.humanPhotoUri) {
        profileAfterSync = (await syncOwnerToApi()) ?? profileAfterSync;
      }

      const imageUrls: string[] = [];
      for (const uri of imageUris) {
        const remote = await resolveRemoteUri(uri);
        if (remote && isHttpUrl(remote)) imageUrls.push(remote);
      }
      const post = await feedApi.createFeedPost(body.trim() || undefined, imageUrls);
      notifyPostCreated(mergeAuthorPhotoSources(post, profileAfterSync, draft));
      router.back();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not publish your post.';
      showTooltip({
        title: 'Publish failed',
        message: tooltipMessageFromError(err, message),
        variant: 'error',
      });
    } finally {
      setPublishing(false);
    }
  }, [
    canPublish,
    publishing,
    body,
    imageUris,
    router,
    draft,
    syncOwnerToApi,
    syncPetToApi,
    showTooltip,
    notifyPostCreated,
  ]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.headerIconBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={PawColors.navLabelActive} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          New Post
        </Text>
        <View style={styles.headerIconBtn} />
      </View>

      <KeyboardAwareFormScroll
        contentContainerStyle={styles.scrollContent}
        keyboardVerticalOffset={insets.top}>
        <View style={styles.profileRow}>
          <View style={styles.dualWrap}>
            <RemoteMediaImage uri={dogPhoto} style={styles.dualDog} contentFit="cover" />
            <RemoteMediaImage uri={humanPhoto} style={styles.dualHuman} contentFit="cover" />
          </View>
          <View style={styles.profileNames} accessibilityLabel={`Posting as ${dogName} with ${humanFirst}`}>
            <Text style={styles.dogName}>{dogName}</Text>
            <Text style={styles.withHuman}>with {humanFirst}</Text>
          </View>
        </View>

        <View style={styles.textareaShell}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={"What's on your mind? Share your pet's story..."}
            placeholderTextColor={PawColors.chipGray}
            multiline
            textAlignVertical="top"
            style={styles.textarea}
            accessibilityLabel="Post text"
          />
        </View>

        <View style={[styles.photoDrop, pickingPhotos && styles.photoDropBusy]}>
          {imageUris.length > 0 ? (
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbRow}
              keyboardShouldPersistTaps="always">
              {imageUris.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.thumbWrap}>
                  <Image
                    source={{ uri }}
                    style={styles.thumb}
                    contentFit="cover"
                    recyclingKey={`${uri}-${index}`}
                  />
                  <Pressable
                    onPress={() => onRemovePhoto(index)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.removePhotoBtn, pressed && styles.removePhotoBtnPressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${index + 1}`}>
                    <Feather name="x" size={16} color={PawColors.destructive} />
                  </Pressable>
                </View>
              ))}
              {imageUris.length < MAX_PHOTOS ? (
                <Pressable
                  onPress={onAddPhotos}
                  disabled={pickingPhotos}
                  style={[styles.thumb, styles.thumbAdd]}
                  accessibilityRole="button"
                  accessibilityLabel="Add more photos"
                  accessibilityState={{ disabled: pickingPhotos }}>
                  <Feather name="plus" size={28} color={PawColors.navLabelActive} />
                </Pressable>
              ) : null}
            </ScrollView>
          ) : (
            <Pressable
              onPress={onAddPhotos}
              disabled={pickingPhotos}
              style={styles.photoDropEmpty}
              accessibilityRole="button"
              accessibilityLabel="Add photos"
              accessibilityHint="Opens your gallery to choose photos for this post"
              accessibilityState={{ disabled: pickingPhotos }}>
              <View style={styles.cameraCircle}>
                <Feather name="camera" size={32} color={PawColors.peachBorder} />
              </View>
              <Text style={styles.addPhotosTitle}>Add Photos</Text>
              <Text style={styles.addPhotosHint}>Tap to select photos from your gallery</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 Share special moments, daily adventures, or funny stories about your pet
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </KeyboardAwareFormScroll>

      <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Pressable
          onPress={onPublish}
          disabled={!canPublish || publishing}
          style={[styles.publishBtn, (!canPublish || publishing) && styles.publishBtnDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canPublish || publishing }}
          accessibilityLabel="Publish post">
          <Feather name="plus" size={18} color={PawColors.black} />
          <Text style={styles.publishText}>{publishing ? 'Publishing…' : 'Publish Post'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PawColors.creamBg,
    maxWidth: PawLayout.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: PawColors.creamBg,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.navLabelActive,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  dualWrap: {
    width: 62,
    height: 61,
    position: 'relative',
  },
  dualDog: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
  dualHuman: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
  profileNames: {
    flex: 1,
    gap: 2,
  },
  dogName: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.navLabelActive,
  },
  withHuman: {
    fontSize: PawFontSize.body,
    fontWeight: '400',
    color: PawColors.chipGray,
  },
  textareaShell: {
    marginTop: 16,
    minHeight: 140,
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  textarea: {
    flex: 1,
    minHeight: 120,
    fontSize: PawFontSize.small,
    fontWeight: '400',
    color: PawColors.black,
    lineHeight: PawLineHeight.small,
  },
  photoDropBusy: {
    opacity: 0.7,
  },
  photoDrop: {
    marginTop: 24,
    minHeight: 254,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(137,137,137,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  photoDropEmpty: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  cameraCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(246,162,116,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  addPhotosTitle: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.navLabelActive,
    marginBottom: 8,
  },
  addPhotosHint: {
    fontSize: PawFontSize.small,
    fontWeight: '500',
    color: PawColors.chipGray,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: PawLineHeight.small,
  },
  thumbRow: {
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  removePhotoBtnPressed: {
    opacity: 0.85,
    backgroundColor: PawColors.destructiveMuted,
  },
  thumbAdd: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  tipBox: {
    marginTop: 20,
    paddingHorizontal: 17,
    paddingVertical: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PawColors.reactionLavender,
    backgroundColor: 'rgba(231,201,254,0.3)',
  },
  tipText: {
    fontSize: PawFontSize.small,
    fontWeight: '400',
    color: 'rgba(51,32,21,0.7)',
    textAlign: 'center',
    lineHeight: PawLineHeight.small,
  },
  footer: {
    borderTopWidth: 2,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 18,
    paddingHorizontal: 20,
    backgroundColor: PawColors.creamBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: PawColors.peachBorder,
    borderWidth: 3,
    borderColor: PawColors.black,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  publishBtnDisabled: {
    opacity: 0.4,
  },
  publishText: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '800',
    color: PawColors.black,
  },
});
