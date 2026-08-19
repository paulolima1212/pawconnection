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

import { PawLogo } from '@/components/paw/paw-logo';
import { useAuth } from '@/context/auth';
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { ApiError } from '@/lib/api/client';
import { getApiBaseUrl } from '@/lib/api/config';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { showTooltip } = usePawTooltip();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || password.length < 6) {
      showTooltip({
        title: 'Invalid credentials',
        message: 'Enter your email and password (min 6 characters).',
        variant: 'info',
      });
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      let message = err instanceof ApiError ? err.message : 'Could not sign in.';
      if (__DEV__ && message.includes('Could not reach')) {
        message += `\n\n(API: ${getApiBaseUrl()})`;
      }
      showTooltip({
        title: 'Sign in failed',
        message: tooltipMessageFromError(err, message),
        variant: 'error',
        durationMs: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onCreateAccount = () => {
    router.replace('/interests');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.logoWrap}>
        <PawLogo variant="mark" />
      </View>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to continue with Paw Connection</Text>

      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={PawColors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={PawColors.textMuted}
          secureTextEntry
          style={styles.input}
        />
      </View>

      <Pressable
        onPress={onLogin}
        disabled={loading}
        style={[styles.primaryBtn, loading && styles.btnDisabled]}>
        {loading ? (
          <ActivityIndicator color={PawColors.black} />
        ) : (
          <Text style={styles.primaryText}>Sign in</Text>
        )}
      </Pressable>

      <Pressable onPress={onCreateAccount} style={styles.secondaryBtn}>
        <Text style={styles.secondaryText}>Create a new account</Text>
      </Pressable>
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
