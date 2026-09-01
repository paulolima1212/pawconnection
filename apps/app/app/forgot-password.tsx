import { useRouter } from 'expo-router';
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
import { requestPasswordReset } from '@/lib/api/auth';
import { getApiBaseUrl } from '@/lib/api/config';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showTooltip } = usePawTooltip();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) {
      showTooltip({
        title: 'Email required',
        message: 'Enter the email address for your account.',
        variant: 'info',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset({ email: email.trim() });
      setSent(true);
      showTooltip({
        title: 'Check your email',
        message: response.message,
        variant: 'success',
        durationMs: 6000,
      });
    } catch (err) {
      let message =
        err instanceof ApiError ? err.message : 'Could not request a password reset.';
      if (__DEV__ && message.includes('Could not reach')) {
        message += `\n\n(API: ${getApiBaseUrl()})`;
      }
      showTooltip({
        title: 'Request failed',
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
        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your account email and we&apos;ll send reset instructions.
        </Text>

        <View style={styles.form}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={PawColors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!sent}
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={loading || sent}
          style={[styles.primaryBtn, (loading || sent) && styles.btnDisabled]}>
          {loading ? (
            <ActivityIndicator color={PawColors.black} />
          ) : (
            <Text style={styles.primaryText}>{sent ? 'Email sent' : 'Send reset link'}</Text>
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
