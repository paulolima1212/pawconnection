import Feather from '@expo/vector-icons/Feather';
import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawColors, PawFontSize } from '@/constants/paw-styles';

export type ProfilePhotoSlide = {
  uri: string;
  label?: string;
};

type ProfilePhotosLightboxProps = {
  visible: boolean;
  photos: ProfilePhotoSlide[];
  initialIndex?: number;
  onClose: () => void;
};

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
/** Ignore dismiss gestures right after open (avoids tap bleed-through). */
const OPEN_GUARD_MS = 420;

export function ProfilePhotosLightbox({
  visible,
  photos,
  initialIndex = 0,
  onClose,
}: ProfilePhotosLightboxProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(initialIndex);

  const translateY = useSharedValue(0);
  const dragOpacity = useSharedValue(1);
  const allowDismiss = useSharedValue(0);
  const allowDismissJsRef = useRef(false);

  const slides = useMemo(() => photos.filter((p) => p.uri.trim()), [photos]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!visible) {
      allowDismissJsRef.current = false;
      allowDismiss.value = 0;
      translateY.value = 0;
      dragOpacity.value = 1;
      return;
    }

    allowDismissJsRef.current = false;
    allowDismiss.value = 0;
    translateY.value = 0;
    dragOpacity.value = 1;

    const safe = Math.min(Math.max(0, initialIndex), slides.length - 1);
    setIndex(safe);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: width * safe, animated: false });
    });

    const guardTimer = setTimeout(() => {
      allowDismissJsRef.current = true;
      allowDismiss.value = 1;
    }, OPEN_GUARD_MS);

    return () => clearTimeout(guardTimer);
  }, [visible, initialIndex, slides.length, width, allowDismiss, translateY, dragOpacity]);

  const requestClose = () => {
    onCloseRef.current();
  };

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(18)
        .failOffsetX([-28, 28])
        .onUpdate((e) => {
          const dy = Math.max(0, e.translationY);
          translateY.value = dy;
          dragOpacity.value = interpolate(dy, [0, height * 0.45], [1, 0.35]);
        })
        .onEnd((e) => {
          if (allowDismiss.value === 0) {
            translateY.value = withSpring(0, { damping: 20, stiffness: 280 });
            dragOpacity.value = withSpring(1);
            return;
          }

          const shouldDismiss =
            e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY;
          if (shouldDismiss) {
            runOnJS(requestClose)();
            return;
          }

          translateY.value = withSpring(0, { damping: 20, stiffness: 280 });
          dragOpacity.value = withSpring(1);
        })
        .onFinalize(() => {
          if (allowDismiss.value === 0) {
            translateY.value = withSpring(0, { damping: 20, stiffness: 280 });
            dragOpacity.value = withSpring(1);
          }
        }),
    [height, translateY, dragOpacity, allowDismiss],
  );

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: interpolate(translateY.value, [0, height * 0.5], [1, 0.92]) },
    ],
    opacity: dragOpacity.value,
  }));

  if (!visible || !slides.length) return null;

  const pageHeight = height - insets.top - insets.bottom;
  const currentLabel = slides[index]?.label;

  const handleRequestClose = () => {
    if (allowDismissJsRef.current) requestClose();
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleRequestClose}>
      <GestureHandlerRootView style={styles.gestureRoot}>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.root,
              { paddingTop: insets.top, paddingBottom: insets.bottom },
              sheetStyle,
            ]}>
            <View style={styles.header}>
              <Pressable
                onPress={requestClose}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close">
                <Feather name="x" size={28} color={PawColors.fieldWhite} />
              </Pressable>
              {slides.length > 1 ? (
                <Text style={styles.counter}>
                  {index + 1} / {slides.length}
                </Text>
              ) : (
                <View style={styles.headerSpacer} />
              )}
            </View>

            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.pager}
              contentContainerStyle={{ height: pageHeight - 56 }}
              onMomentumScrollEnd={(e) => {
                const next = Math.round(e.nativeEvent.contentOffset.x / width);
                setIndex(next);
              }}>
              {slides.map((slide) => (
                <View key={slide.uri} style={[styles.page, { width, height: pageHeight - 56 }]}>
                  <RemoteMediaImage uri={slide.uri} style={styles.image} contentFit="contain" />
                </View>
              ))}
            </ScrollView>

            {currentLabel ? (
              <Text style={styles.caption} numberOfLines={2}>
                {currentLabel}
              </Text>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  headerSpacer: {
    width: 44,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.fieldWhite,
  },
  pager: {
    flex: 1,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  caption: {
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.fieldWhite,
  },
});
