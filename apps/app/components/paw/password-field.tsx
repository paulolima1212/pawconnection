import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type PasswordFieldProps = Omit<TextInputProps, 'secureTextEntry'> & {
  /** `new` for registration and reset. `current` for sign-in. */
  purpose?: 'current' | 'new';
  tone?: 'white' | 'gray';
};

export function PasswordField({
  purpose = 'current',
  tone = 'white',
  style,
  ...rest
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Hide password' : 'Show password';

  return (
    <View style={[styles.field, tone === 'gray' && styles.fieldGray]}>
      <TextInput
        {...rest}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={purpose === 'new' ? 'newPassword' : 'password'}
        autoComplete={purpose === 'new' ? 'password-new' : 'password'}
        importantForAutofill="yes"
        placeholderTextColor={rest.placeholderTextColor ?? PawColors.textPlaceholder}
        style={[styles.input, style]}
      />
      <Pressable
        onPress={() => setVisible((current) => !current)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Toggles whether the password is visible">
        <Feather name={visible ? 'eye-off' : 'eye'} size={20} color={PawColors.black} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    minHeight: 50,
    paddingHorizontal: 16,
    gap: 8,
  },
  fieldGray: {
    backgroundColor: PawColors.fieldGray,
  },
  input: {
    flex: 1,
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    color: PawColors.black,
    paddingVertical: 0,
  },
});
