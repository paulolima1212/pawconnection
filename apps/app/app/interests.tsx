import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PawLogo } from '@/components/paw/paw-logo';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { INTEREST_OPTIONS, useProfileOnboarding } from '@/context/profile-onboarding';

export default function InterestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, toggleInterest } = useProfileOnboarding();

  const onNext = () => {
    router.push('/setup-dog');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrap}>
          <PawLogo variant="mark" />
        </View>
        <Text style={styles.title}>I&apos;m interested in</Text>
        <Text style={styles.subtitle}>Chose as many as you like</Text>
        <View style={styles.options}>
          {INTEREST_OPTIONS.map((label) => {
            const selected = draft.interests.includes(label);
            return (
              <Pressable
                key={label}
                onPress={() => toggleInterest(label)}
                style={[styles.option, selected && styles.optionSelected]}>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Pressable onPress={onNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PawColors.creamBg,
    maxWidth: PawLayout.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  scroll: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingBottom: 100,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 40,
  },
  title: {
    fontSize: PawFontSize.body,
    fontWeight: '400',
    color: PawColors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
    textAlign: 'center',
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  option: {
    backgroundColor: PawColors.fieldGray,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: PawColors.reactionLavender,
    borderWidth: 2,
  },
  optionText: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 8,
  },
  nextBtn: {
    backgroundColor: PawColors.peachBorder,
    borderWidth: 2.5,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.black,
  },
});
