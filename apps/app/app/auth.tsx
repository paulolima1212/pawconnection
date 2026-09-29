import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { PasswordField } from '@/components/paw/password-field';
import { PawLogo } from '@/components/paw/paw-logo';
import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { useAuth } from '@/context/auth';
import { useProfileOnboarding } from '@/context/profile-onboarding';
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { ApiError } from '@/lib/api/client';
import { getApiBaseUrl } from '@/lib/api/config';
import { loadLastAccount, type LastAccount } from '@/lib/last-account';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { clearLocalProfile } = useProfileOnboarding();
  const { showTooltip } = usePawTooltip();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastAccount, setLastAccount] = useState<LastAccount | null>(null);
  const [useAnother, setUseAnother] = useState(false);

  useEffect(() => {
    void loadLastAccount().then((account) => {
      setLastAccount(account);
      if (account?.email) setEmail(account.email);
    });
  }, []);

  const remembered = lastAccount && !useAnother ? lastAccount : null;

  const onLogin = async () => {
    const address = (remembered?.email ?? email).trim();
    if (!address || !password) {
      showTooltip({
        title: 'Sign in',
        message: 'Enter your email and password.',
        variant: 'info',
      });
      return;
    }
    setLoading(true);
    try {
      await login(address, password);
      router.replace('/');
    } catch (err) {
      let message = 'Could not sign in.';
      if (err instanceof ApiError) {
        if (err.status === 0) message = err.message;
        else if (err.status === 401) message = 'Incorrect email or password.';
        else message = err.message;
      }
      if (__DEV__ && message.includes('Could not reach')) {
        message += `\n\n(API: ${getApiBaseUrl()})`;
      }
      showTooltip({
        title: err instanceof ApiError && err.status === 0 ? 'Connection problem' : 'Sign in failed',
        message: tooltipMessageFromError(err, message),
        variant: 'error',
        durationMs: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onCreateAccount = () => {
    void (async () => {
      await clearLocalProfile();
      router.replace('/interests');
    })();
  };

  const onForgotPassword = () => {
    router.push('/forgot-password' as Href);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAwareFormScroll
        contentContainerStyle={styles.scroll}
        keyboardVerticalOffset={insets.top}>
        <View style={styles.logoWrap}>
          <PawLogo variant="mark" />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue with Paw Connection</Text>

        {remembered ? (
          <View style={styles.remembered}>
            <View style={styles.avatar}>
              {remembered.photoUrl ? (
                <RemoteMediaImage uri={remembered.photoUrl} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarInitial}>{remembered.displayName.slice(0, 1)}</Text>
              )}
            </View>
            <Text style={styles.rememberedName}>{remembered.displayName}</Text>
            <Text style={styles.rememberedEmail}>{remembered.email}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {remembered ? null : (
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={PawColors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              autoComplete="email"
              importantForAutofill="yes"
              style={styles.input}
            />
          )}
          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={PawColors.textMuted}
          />
        </View>

        <Pressable onPress={onForgotPassword} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <Pressable
          onPress={onLogin}
          disabled={loading}
          style={[styles.primaryBtn, loading && styles.btnDisabled]}>
          {loading ? (
            <ActivityIndicator color={PawColors.black} />
          ) : (
            <Text style={styles.primaryText}>
              {remembered ? `Continue as ${remembered.displayName.split(' ')[0]}` : 'Sign in'}
            </Text>
          )}
        </Pressable>

        {remembered ? (
          <Pressable
            onPress={() => {
              setUseAnother(true);
              setEmail('');
              setPassword('');
            }}
            style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Use another account</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={onCreateAccount} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>Create a new account</Text>
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.navLabelActive,
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    marginTop: 16,
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
  remembered: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: PawColors.black,
  },
  rememberedName: {
    marginTop: 12,
    fontSize: PawFontSize.title,
    fontWeight: '800',
    color: PawColors.black,
  },
  rememberedEmail: {
    marginTop: 4,
    fontSize: PawFontSize.body,
    color: PawColors.textMuted,
  },
});
