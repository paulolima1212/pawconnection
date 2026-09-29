import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { FieldInput } from '@/components/paw/field-input';
import { ProfileFieldInput } from '@/components/paw/profile-field-input';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import { searchLocalities } from '@/lib/api/map';
import { localitySearchQuery } from '@/lib/locality-search';

type LocationAutocompleteProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  variant?: 'default' | 'profile';
  containerStyle?: StyleProp<ViewStyle>;
};

export function LocationAutocomplete({
  value,
  onChangeText,
  placeholder = 'City or neighborhood',
  variant = 'default',
  containerStyle,
}: LocationAutocompleteProps) {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!focused) return;
    const query = localitySearchQuery(value);
    if (!query) {
      setSuggestions([]);
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      void searchLocalities(query)
        .then((items) => {
          if (requestId.current !== id) return;
          setSuggestions(items.filter((item) => item !== value.trim()));
        })
        .catch(() => {
          if (requestId.current === id) setSuggestions([]);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [focused, value]);

  const clearBlurTimer = () => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  };

  const handleFocus = () => {
    clearBlurTimer();
    setFocused(true);
  };

  const handleBlur = () => {
    clearBlurTimer();
    blurTimerRef.current = setTimeout(() => setFocused(false), 180);
  };

  const selectLocation = (label: string) => {
    clearBlurTimer();
    requestId.current += 1;
    onChangeText(label);
    setSuggestions([]);
    setFocused(false);
  };

  const showList = focused && suggestions.length > 0;

  return (
    <View style={[styles.root, containerStyle]}>
      {variant === 'profile' ? (
        <ProfileFieldInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="words"
          accessibilityLabel="City or neighborhood"
          accessibilityHint="Type a city or neighborhood to see suggestions"
        />
      ) : (
        <FieldInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="words"
          accessibilityLabel="City or neighborhood"
          accessibilityHint="Type a city or neighborhood to see suggestions"
        />
      )}
      {showList ? (
        <View style={[styles.list, variant === 'profile' && styles.listProfile]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}>
            {suggestions.map((label, index) => (
              <Pressable
                key={label}
                onPress={() => selectLocation(label)}
                style={({ pressed }) => [
                  styles.row,
                  index < suggestions.length - 1 && styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${label}`}>
                <Text style={styles.rowText}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 2,
  },
  list: {
    marginTop: 6,
    maxHeight: 200,
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
    overflow: 'hidden',
  },
  listProfile: {
    borderColor: PawColors.profileFieldBorder,
    borderRadius: 12,
  },
  scroll: {
    maxHeight: 200,
  },
  scrollContent: {
    paddingVertical: 2,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PawColors.black,
  },
  rowPressed: {
    backgroundColor: PawColors.reactionLavender,
  },
  rowText: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
  },
});
