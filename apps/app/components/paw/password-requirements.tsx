import { StyleSheet, Text, View } from 'react-native';

import { PawColors, PawFontSize } from '@/constants/paw-styles';
import {
  PASSWORD_RULE_LABELS,
  passwordRuleResults,
  type PasswordRuleId,
} from '@/lib/password-policy';

const ORDER: PasswordRuleId[] = ['length', 'upper', 'lower', 'number', 'special'];

export function PasswordRequirements({ password }: { password: string }) {
  const results = passwordRuleResults(password);

  return (
    <View style={styles.list} accessibilityRole="text">
      {ORDER.map((id) => {
        const met = results[id];
        return (
          <Text
            key={id}
            style={[styles.row, met ? styles.met : styles.unmet]}
            accessibilityLabel={`${met ? 'Met' : 'Not met'}: ${PASSWORD_RULE_LABELS[id]}`}>
            {met ? '✓' : '✗'} {PASSWORD_RULE_LABELS[id]}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 8,
    gap: 2,
  },
  row: {
    fontSize: PawFontSize.body,
    lineHeight: 22,
  },
  met: {
    color: PawColors.profileBrown,
    fontWeight: '600',
  },
  unmet: {
    color: PawColors.textMuted,
    fontWeight: '400',
  },
});
