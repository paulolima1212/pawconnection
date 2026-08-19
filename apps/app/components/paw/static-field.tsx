import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type StaticFieldProps = {
  placeholder: string;
  style?: StyleProp<ViewStyle>;
  multiline?: boolean;
  rightIconUri?: string;
  leftIconUri?: string;
  valueText?: string;
};

export function StaticField({
  placeholder,
  style,
  multiline,
  rightIconUri,
  leftIconUri,
  valueText,
}: StaticFieldProps) {
  const showValue = valueText != null && valueText.length > 0;
  return (
    <View style={[styles.field, multiline && styles.fieldTall, style]}>
      {leftIconUri ? (
        <Image source={{ uri: leftIconUri }} style={styles.leftIcon} contentFit="contain" />
      ) : null}
      <Text style={[styles.text, showValue && styles.value]} numberOfLines={multiline ? 4 : 1}>
        {showValue ? valueText : placeholder}
      </Text>
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
    height: 50,
    paddingHorizontal: 16,
    gap: 10,
  },
  fieldTall: {
    height: 70,
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  text: {
    flex: 1,
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.textPlaceholder,
  },
  value: {
    color: PawColors.black,
  },
  leftIcon: {
    width: 24,
    height: 24,
  },
  rightIcon: {
    width: 12,
    height: 24,
  },
});
