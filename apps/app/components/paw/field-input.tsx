import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useState, type ComponentProps } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type FieldInputProps = TextInputProps & {
  leftIconUri?: string;
  leftIconSource?: ImageSourcePropType;
  /** Feather icon name shown on the left (e.g. search) */
  leftFeatherIcon?: ComponentProps<typeof Feather>['name'];
  rightIconUri?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** `white` matches Figma “Favorite meal” (white fill, rounded corners) */
  variant?: 'default' | 'white';
  /** Hide placeholder text while the field is focused (default: true) */
  hidePlaceholderOnFocus?: boolean;
};

export function FieldInput({
  leftIconUri,
  leftIconSource,
  leftFeatherIcon,
  rightIconUri,
  style,
  containerStyle,
  variant = 'default',
  hidePlaceholderOnFocus = true,
  placeholder,
  onFocus,
  onBlur,
  scrollEnabled: scrollEnabledProp,
  ...rest
}: FieldInputProps) {
  const [focused, setFocused] = useState(false);
  const multiline = Boolean(rest.multiline);
  const showPlaceholder = hidePlaceholderOnFocus ? !focused : true;

  const handleFocus: TextInputProps['onFocus'] = (event) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur: TextInputProps['onBlur'] = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  const leftSource =
    leftIconSource ?? (leftIconUri ? ({ uri: leftIconUri } as ImageSourcePropType) : null);

  return (
    <View
      style={[
        styles.field,
        multiline && styles.fieldTall,
        variant === 'white' && styles.fieldWhite,
        containerStyle,
      ]}>
      {leftFeatherIcon ? (
        <Feather name={leftFeatherIcon} size={22} color={PawColors.black} style={styles.leftIcon} />
      ) : leftSource ? (
        <Image source={leftSource} style={styles.leftIcon} contentFit="contain" />
      ) : null}
      <TextInput
        placeholder={showPlaceholder ? placeholder : undefined}
        placeholderTextColor={PawColors.textPlaceholder}
        style={[styles.input, multiline && styles.inputMultiline, style]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
        scrollEnabled={multiline ? false : scrollEnabledProp}
      />
      {rightIconUri ? (
        <Image source={{ uri: rightIconUri }} style={styles.rightIcon} contentFit="contain" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PawColors.fieldGray,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    minHeight: 50,
    paddingHorizontal: 16,
    gap: 10,
  },
  fieldWhite: {
    backgroundColor: PawColors.fieldWhite,
    borderRadius: PawLayout.borderRadiusWhiteField,
  },
  fieldTall: {
    minHeight: 70,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
    paddingVertical: 0,
  },
  inputMultiline: {
    minHeight: 44,
    textAlignVertical: 'top',
  },
  leftIcon: {
    width: 24,
    height: 24,
  },
  rightIcon: {
    width: 12,
    height: 24,
    marginTop: 2,
  },
});
