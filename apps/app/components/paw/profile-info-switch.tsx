import { PawSegmentedSwitch } from '@/components/paw/paw-segmented-switch';

export type ProfileInfoTab = 'pet' | 'owner';

const TABS: { id: ProfileInfoTab; label: string }[] = [
  { id: 'pet', label: 'Pet Info' },
  { id: 'owner', label: 'Owner Info' },
];

type ProfileInfoSwitchProps = {
  value: ProfileInfoTab;
  onChange: (value: ProfileInfoTab) => void;
};

export function ProfileInfoSwitch({ value, onChange }: ProfileInfoSwitchProps) {
  return <PawSegmentedSwitch variant="profile" tabs={TABS} value={value} onChange={onChange} />;
}
