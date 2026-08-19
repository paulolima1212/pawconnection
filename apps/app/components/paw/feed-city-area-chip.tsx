import Feather from '@expo/vector-icons/Feather';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChipOptionDropdown } from '@/components/paw/chip-option-dropdown';
import { FEED_CITY_ALL_OPTION } from '@/constants/feed-discovery-filters';
import type { FeedCityBlockedReason, FeedCityOption, FeedCityPermissionState } from '@/hooks/use-feed-nearby-cities';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import { usePawTooltip } from '@/context/paw-tooltip';

const ALERT_TITLE: Record<FeedCityBlockedReason, string> = {
  permission: 'Location required',
  geocode: 'Could not load suburbs',
};

const ALERT_MESSAGE: Record<FeedCityBlockedReason, string> = {
  permission:
    'Paw Connection needs access to your location to list nearby suburbs and to use distance-based features. Please allow location access in your device settings.',
  geocode:
    "We couldn't determine places near your current location. Check your internet connection and try again.",
};

type FeedCityAreaChipProps = {
  permission: FeedCityPermissionState;
  blockedReason?: FeedCityBlockedReason;
  cityOptions: FeedCityOption[];
  selectedCity: string;
  onSelectCity: (value: string) => void;
  /** Called when the chip is tapped without a suburb list; requests GPS and reloads areas. */
  onRequestLocation?: () => Promise<boolean>;
  /** True while re-sampling suburbs after radius (or session) change. */
  citiesRefreshing?: boolean;
};

export function FeedCityAreaChip({
  permission,
  blockedReason,
  cityOptions,
  selectedCity,
  onSelectCity,
  onRequestLocation,
  citiesRefreshing = false,
}: FeedCityAreaChipProps) {
  const { showTooltip } = usePawTooltip();

  const showBlockedTooltip = (reason: FeedCityBlockedReason, onRetry?: () => void) => {
    if (reason === 'permission') {
      showTooltip({
        title: ALERT_TITLE.permission,
        message: ALERT_MESSAGE.permission,
        variant: 'info',
        durationMs: 8000,
        action: { label: 'Open settings', onPress: () => Linking.openSettings() },
      });
      return;
    }
    showTooltip({
      title: ALERT_TITLE.geocode,
      message: ALERT_MESSAGE.geocode,
      variant: 'error',
      durationMs: 6000,
      action: onRetry ? { label: 'Retry', onPress: () => void onRetry() } : undefined,
    });
  };

  if (permission === 'ready' && cityOptions.length > 0) {
    const options = [FEED_CITY_ALL_OPTION, ...cityOptions];
    const value = selectedCity || FEED_CITY_ALL_OPTION.value;
    return (
      <ChipOptionDropdown
        value={value}
        options={options}
        onChange={onSelectCity}
        sheetTitle="Nearby suburbs"
        accessibilityLabel="City or suburb near you"
        accessibilityHint="Choose a suburb based on your location"
        busy={citiesRefreshing}
      />
    );
  }

  const isBusy = permission === 'loading' && cityOptions.length === 0;
  const label = isBusy ? 'Finding area…' : 'Choose area';

  const handlePress = async () => {
    if (isBusy || !onRequestLocation) return;

    const granted = await onRequestLocation();
    if (!granted) {
      showBlockedTooltip(blockedReason ?? 'permission', () => {
        void onRequestLocation();
      });
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => {
          void handlePress();
        }}
        disabled={isBusy}
        style={({ pressed }) => [
          styles.chip,
          isBusy && styles.chipDisabled,
          pressed && !isBusy && styles.chipPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="City or suburb near you"
        accessibilityHint={
          isBusy
            ? 'Loading nearby suburbs from your location'
            : 'Tap to allow location and choose a nearby suburb'
        }>
        <Text style={styles.chipText} numberOfLines={1}>
          {label}
        </Text>
        <Feather name="chevron-down" size={20} color={PawColors.black} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 0,
    maxWidth: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 0.7,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusPill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipDisabled: {
    opacity: 0.65,
  },
  chipText: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
    flexShrink: 1,
  },
});
