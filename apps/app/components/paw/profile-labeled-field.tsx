import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ProfileFieldInput } from '@/components/paw/profile-field-input';
import { PawColors, PawFontSize, PawLineHeight } from '@/constants/paw-styles';

type FeatherIcon = ComponentProps<typeof Feather>['name'];

type ProfileLabeledFieldBase = {
  label: string;
  icon: FeatherIcon;
};

type ProfileLabeledFieldInput = ProfileLabeledFieldBase & {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: ComponentProps<typeof ProfileFieldInput>['keyboardType'];
  children?: never;
};

type ProfileLabeledFieldSlot = ProfileLabeledFieldBase & {
  children: ReactNode;
  value?: never;
  onChangeText?: never;
};

export type ProfileLabeledFieldProps = ProfileLabeledFieldInput | ProfileLabeledFieldSlot;

export function ProfileLabeledField(props: ProfileLabeledFieldProps) {
  const { label, icon } = props;

  return (
    <View style={styles.block}>
      <View style={styles.labelRow}>
        <Feather name={icon} size={16} color={PawColors.peach} style={styles.labelIcon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      {'children' in props && props.children ? (
        props.children
      ) : (
        <ProfileFieldInput
          value={(props as ProfileLabeledFieldInput).value}
          onChangeText={(props as ProfileLabeledFieldInput).onChangeText}
          placeholder={(props as ProfileLabeledFieldInput).placeholder}
          multiline={(props as ProfileLabeledFieldInput).multiline}
          keyboardType={(props as ProfileLabeledFieldInput).keyboardType}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 21,
  },
  labelIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: PawFontSize.small,
    lineHeight: PawLineHeight.small + 3,
    fontWeight: '600',
    color: PawColors.profileBrown,
  },
});
