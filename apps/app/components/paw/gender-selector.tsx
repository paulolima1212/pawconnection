import { OptionDropdown } from '@/components/paw/option-dropdown';
import type { GenderValue } from '@/context/profile-onboarding';

const OPTIONS: { value: GenderValue; label: string }[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

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
      options={OPTIONS}
      onChange={onChange}
      sheetTitle="Gender"
      accessibilityLabel="Gender"
      accessibilityHint="Opens list to choose Male or Female"
      placeholder={placeholder}
      variant={variant}
    />
  );
}
