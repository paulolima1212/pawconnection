import { useEffect, useState } from 'react';

import { FieldInput } from '@/components/paw/field-input';
import {
  formatBirthdayDisplay,
  maskBirthdayTyping,
  parseBirthdayInput,
} from '@/lib/pet-birthday';

type BirthdayFieldProps = {
  /** Stored value as YYYY-MM-DD (or empty). */
  value: string;
  onChangeIso: (iso: string) => void;
  placeholder?: string;
};

/**
 * Birthday text field (DD/MM/YYYY). Commits YYYY-MM-DD when the date is complete/valid.
 *
 * TODO(backlog): notify owner + friends on pet birthday —
 * docs/backlog/pet-birthday-notifications.md
 */
export function BirthdayField({
  value,
  onChangeIso,
  placeholder = 'DD/MM/YYYY',
}: BirthdayFieldProps) {
  const [text, setText] = useState(() => formatBirthdayDisplay(value));

  useEffect(() => {
    const display = formatBirthdayDisplay(value);
    const typedIso = parseBirthdayInput(text);
    if (value && value !== typedIso) {
      setText(display);
    }
  }, [value, text]);

  return (
    <FieldInput
      placeholder={placeholder}
      value={text}
      onChangeText={(raw) => {
        const masked = maskBirthdayTyping(raw);
        setText(masked);
        if (!masked) {
          onChangeIso('');
          return;
        }
        const iso = parseBirthdayInput(masked);
        if (iso) onChangeIso(iso);
      }}
      keyboardType="number-pad"
      maxLength={10}
      accessibilityLabel="Birthday"
      accessibilityHint="Enter pet date of birth as day month year"
    />
  );
}
