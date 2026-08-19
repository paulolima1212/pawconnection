import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToastPalette } from '@/constants/toast-styles';
import { PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom' | 'center';

export type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  position: ToastPosition;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
};

export type ToastProps = {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  isVisible: boolean;
  onClose: () => void;
  position?: ToastPosition;
  action?: ToastItem['action'];
};

const ICON_BY_TYPE: Record<ToastType, ComponentProps<typeof Feather>['name']> = {
  success: 'check-circle',
  error: 'x-circle',
  warning: 'alert-triangle',
  info: 'info',
};

function toastTheme(type: ToastType) {
  return ToastPalette[type];
}

export function Toast({
  type,
  title,
  message,
  duration = 3000,
  isVisible,
  onClose,
  action,
}: ToastProps) {
  const theme = toastTheme(type);
  const translateY = useSharedValue(-24);
  const opacity = useSharedValue(0);
  const progress = useSharedValue(1);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dismiss = useCallback(() => {
    translateY.value = withTiming(-24, { duration: 200 });
    opacity.value = withTiming(0, { duration: 160 }, (finished) => {
      if (finished) runOnJS(onCloseRef.current)();
    });
  }, [opacity, translateY]);

  useEffect(() => {
    if (!isVisible) return;

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    translateY.value = withSpring(0, { damping: 18, stiffness: 240 });
    opacity.value = withTiming(1, { duration: 180 });
    progress.value = 1;

    const autoClose = duration > 0 && !action;
    if (autoClose) {
      progress.value = withTiming(0, { duration });
      hideTimerRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isVisible, duration, dismiss, opacity, translateY, progress, action]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.max(0, progress.value) }],
  }));

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: theme.background,
          borderColor: ToastPalette.frame,
        },
        cardStyle,
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert">
      <View style={[styles.iconWrap, { borderColor: theme.border }]}>
        <Feather name={ICON_BY_TYPE[type]} size={22} color={theme.foreground} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
        {message ? (
          <Text style={[styles.message, { color: theme.foreground, opacity: 0.92 }]}>
            {message}
          </Text>
        ) : null}
        {action ? (
          <Pressable
            onPress={() => {
              action.onPress();
              dismiss();
            }}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={action.label}>
            <Text style={[styles.actionText, { color: theme.foreground }]}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        onPress={dismiss}
        hitSlop={10}
        style={[styles.closeBtn, { borderColor: theme.border }]}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification">
        <Feather name="x" size={18} color={theme.foreground} />
      </Pressable>
      {duration > 0 ? (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.border },
              progressStyle,
            ]}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

type ToastContainerProps = {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  const byPosition = {
    top: toasts.filter((t) => t.position === 'top'),
    center: toasts.filter((t) => t.position === 'center'),
    bottom: toasts.filter((t) => t.position === 'bottom'),
  };

  const renderStack = (items: ToastItem[], position: ToastPosition) => {
    if (items.length === 0) return null;

    const edgeStyle =
      position === 'top'
        ? { paddingTop: insets.top + 8 }
        : position === 'bottom'
          ? { paddingBottom: Math.max(12, insets.bottom + 8) }
          : undefined;

    return (
      <View
        style={[
          styles.stack,
          position === 'top' && styles.stackTop,
          position === 'center' && styles.stackCenter,
          position === 'bottom' && styles.stackBottom,
          edgeStyle,
        ]}
        pointerEvents="box-none">
        {items.map((item) => (
          <Toast
            key={item.id}
            type={item.type}
            title={item.title}
            message={item.message}
            duration={item.duration}
            isVisible
            position={item.position}
            action={item.action}
            onClose={() => {
              item.onDismiss?.();
              onRemove(item.id);
            }}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {renderStack(byPosition.top, 'top')}
      {renderStack(byPosition.center, 'center')}
      {renderStack(byPosition.bottom, 'bottom')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  stack: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: PawLayout.horizontalPadding,
    maxWidth: PawLayout.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
    gap: 10,
  },
  stackTop: {
    top: 0,
  },
  stackCenter: {
    top: '38%',
  },
  stackBottom: {
    bottom: 0,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 3,
    borderRadius: PawLayout.borderRadiusCard + 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textWrap: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  title: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    lineHeight: PawLineHeight.subtitle,
  },
  message: {
    fontSize: PawFontSize.small,
    fontWeight: '400',
    lineHeight: PawLineHeight.small,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: ToastPalette.frame,
    borderRadius: PawLayout.borderRadiusPill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionBtnPressed: {
    opacity: 0.85,
  },
  actionText: {
    fontSize: PawFontSize.small,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    left: 3,
    right: 3,
    bottom: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    borderRadius: 2,
    transformOrigin: 'left',
  },
});
