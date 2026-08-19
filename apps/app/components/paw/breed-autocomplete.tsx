import { useMemo, useRef, useState } from 'react';
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
import { filterDogBreeds } from '@/constants/dog-breeds';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type BreedAutocompleteProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** `profile` uses ProfileFieldInput styling */
  variant?: 'default' | 'profile';
  containerStyle?: StyleProp<ViewStyle>;
  maxSuggestions?: number;
};

export function BreedAutocomplete({
  value,
  onChangeText,
  placeholder = 'Breed',
  variant = 'default',
  containerStyle,
  maxSuggestions = 8,
}: BreedAutocompleteProps) {
  const [focused, setFocused] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(
    () => (focused ? filterDogBreeds(value, maxSuggestions) : []),
    [focused, maxSuggestions, value],
  );
  const showList = focused && suggestions.length > 0;

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
    // Delay so suggestion press registers before list hides
    blurTimerRef.current = setTimeout(() => setFocused(false), 180);
  };

  const selectBreed = (breed: string) => {
    clearBlurTimer();
    onChangeText(breed);
    setFocused(false);
  };

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
          accessibilityLabel="Breed"
          accessibilityHint="Type to see breed suggestions"
        />
      ) : (
        <FieldInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          leftFeatherIcon="search"
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="words"
          accessibilityLabel="Breed"
          accessibilityHint="Type to see breed suggestions"
        />
      )}

      {showList ? (
        <View style={[styles.list, variant === 'profile' && styles.listProfile]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}>
            {suggestions.map((breed, index) => (
              <Pressable
                key={breed}
                onPress={() => selectBreed(breed)}
                style={({ pressed }) => [
                  styles.row,
                  index < suggestions.length - 1 && styles.rowBorder,
                  pressed && styles.rowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select ${breed}`}>
                <Text style={styles.rowText}>{breed}</Text>
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
