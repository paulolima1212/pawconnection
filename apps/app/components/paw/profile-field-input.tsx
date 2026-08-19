import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { PawColors, PawFontSize, PawLineHeight } from '@/constants/paw-styles';

type ProfileFieldInputProps = TextInputProps & {
  /** Hide placeholder text while the field is focused (default: true) */
  hidePlaceholderOnFocus?: boolean;
};

export function ProfileFieldInput({
  style,
  hidePlaceholderOnFocus = true,
  placeholder,
  onFocus,
  onBlur,
  scrollEnabled: scrollEnabledProp,
  ...rest
}: ProfileFieldInputProps) {
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

  return (
    <TextInput
      placeholder={showPlaceholder ? placeholder : undefined}
      placeholderTextColor="rgba(51,32,21,0.5)"
      style={[
        styles.input,
        multiline && styles.inputMultiline,
        multiline && styles.inputTall,
        style,
      ]}
      {...rest}
      onFocus={handleFocus}
      onBlur={handleBlur}
      scrollEnabled={multiline ? false : scrollEnabledProp}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 2,
    borderColor: PawColors.profileFieldBorder,
    borderRadius: 12,
    minHeight: 50.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '400',
    color: PawColors.profileBrown,
  },
  inputTall: {
    minHeight: 118,
    textAlignVertical: 'top',
  },
  inputMultiline: {
    paddingTop: 12,
  },
});
