import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareFormScroll } from '@/components/paw/keyboard-aware-form-scroll';
import { PawLogo } from '@/components/paw/paw-logo';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import { ApiError } from '@/lib/api/client';
import { resetPassword } from '@/lib/api/auth';
import { getApiBaseUrl } from '@/lib/api/config';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const { showTooltip } = usePawTooltip();
  const [token, setToken] = useState(
    typeof params.token === 'string' ? params.token : '',
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!token.trim()) {
      showTooltip({
        title: 'Reset token required',
        message: 'Open the link from your email or paste the reset token here.',
        variant: 'info',
      });
      return;
    }
    if (password.length < 6) {
      showTooltip({
        title: 'Password too short',
        message: 'Use at least 6 characters.',
        variant: 'info',
      });
      return;
    }
    if (password !== confirmPassword) {
      showTooltip({
        title: 'Passwords do not match',
        message: 'Confirm your new password.',
        variant: 'info',
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token: token.trim(), password });
      showTooltip({
        title: 'Password updated',
        message: 'You can now sign in with your new password.',
        variant: 'success',
        durationMs: 5000,
      });
      router.replace('/auth');
    } catch (err) {
      let message =
        err instanceof ApiError ? err.message : 'Could not reset your password.';
      if (__DEV__ && message.includes('Could not reach')) {
        message += `\n\n(API: ${getApiBaseUrl()})`;
      }
      showTooltip({
        title: 'Reset failed',
        message: tooltipMessageFromError(err, message),
        variant: 'error',
        durationMs: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAwareFormScroll
        contentContainerStyle={styles.scroll}
        keyboardVerticalOffset={insets.top}>
        <View style={styles.logoWrap}>
          <PawLogo variant="mark" />
        </View>
        <Text style={styles.title}>Choose a new password</Text>
        <Text style={styles.subtitle}>
          Enter the reset token from your email and your new password.
        </Text>

        <View style={styles.form}>
          <TextInput
            value={token}
            onChangeText={setToken}
            placeholder="Reset token"
            placeholderTextColor={PawColors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password"
            placeholderTextColor={PawColors.textMuted}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={PawColors.textMuted}
            secureTextEntry
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={[styles.primaryBtn, loading && styles.btnDisabled]}>
          {loading ? (
            <ActivityIndicator color={PawColors.black} />
          ) : (
            <Text style={styles.primaryText}>Update password</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace('/auth')} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>Back to sign in</Text>
        </Pressable>
      </KeyboardAwareFormScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PawColors.creamBg,
    paddingHorizontal: PawLayout.horizontalPadding,
    maxWidth: PawLayout.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
  },
  title: {
    fontSize: PawFontSize.title,
    fontWeight: '800',
    color: PawColors.black,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    height: 50,
    paddingHorizontal: 16,
    fontSize: PawFontSize.body,
    color: PawColors.black,
  },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: PawColors.peachBorder,
    borderWidth: 3,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    fontSize: PawFontSize.body,
    fontWeight: '800',
    color: PawColors.black,
  },
  secondaryBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  secondaryText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.navLabelActive,
    textDecorationLine: 'underline',
  },
});
