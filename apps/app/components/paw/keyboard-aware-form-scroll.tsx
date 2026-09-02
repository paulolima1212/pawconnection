import type { PropsWithChildren } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { useKeyboardHeight } from '@/hooks/use-keyboard-height';

type KeyboardAwareFormScrollProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Kept for API compatibility with callers that pass a header offset */
  keyboardVerticalOffset?: number;
  /** Extra gap below the last field when the keyboard is open */
  keyboardOpenBottomGap?: number;
}>;

/**
 * Scrollable form that keeps the keyboard open and adds enough bottom space to
 * reach the last field/button above the keyboard.
 *
 * Uses the gesture-handler ScrollView so dragging works while a TextInput stays
 * focused, and reserves keyboard-sized bottom padding because edge-to-edge
 * Android does not resize the window for the IME.
 */
export function KeyboardAwareFormScroll({
  children,
  contentContainerStyle,
  style,
  keyboardOpenBottomGap = 24,
}: KeyboardAwareFormScrollProps) {
  const keyboardHeight = useKeyboardHeight();
  const baseContentStyle = StyleSheet.flatten(contentContainerStyle) ?? {};
  const baseBottomPadding =
    typeof baseContentStyle.paddingBottom === 'number' ? baseContentStyle.paddingBottom : 0;

  return (
    <ScrollView
      style={[styles.flex, style]}
      contentContainerStyle={[
        contentContainerStyle,
        keyboardHeight > 0 && {
          paddingBottom: baseBottomPadding + keyboardHeight + keyboardOpenBottomGap,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled>
      {children}
    </ScrollView>
  );
}

export function useKeyboardAwareBottomPadding(baseBottom = 0, extraGap = 24) {
  const keyboardHeight = useKeyboardHeight();
  return keyboardHeight > 0 ? baseBottom + keyboardHeight + extraGap : baseBottom;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
