import { OptionDropdown } from '@/components/paw/option-dropdown';
import { GENDER_OPTIONS, type GenderValue } from '@/lib/profile-values';

type GenderSelectorProps = {
  value: GenderValue | '';
  onChange: (value: GenderValue) => void;
  variant?: 'default' | 'profile';
  placeholder?: string;
};

export function GenderSelector({
  value,
  onChange,
  variant = 'default',
  placeholder = 'Select gender',
}: GenderSelectorProps) {
  return (
    <OptionDropdown
      value={value}
      options={GENDER_OPTIONS}
      onChange={onChange}
      sheetTitle="Gender"
      accessibilityLabel="Gender"
      accessibilityHint="Opens list to choose Male, Female, or Other"
      placeholder={placeholder}
      variant={variant}
    />
  );
}
