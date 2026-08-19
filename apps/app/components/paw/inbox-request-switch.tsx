import { PawSegmentedSwitch } from '@/components/paw/paw-segmented-switch';
import type { InboxSwitchTab } from '@/constants/inbox-mocks';
import { INBOX_SWITCH_TABS } from '@/constants/inbox-mocks';

type InboxRequestSwitchProps = {
  value: InboxSwitchTab;
  onChange: (value: InboxSwitchTab) => void;
};

export function InboxRequestSwitch({ value, onChange }: InboxRequestSwitchProps) {
  return (
    <PawSegmentedSwitch variant="inbox" tabs={INBOX_SWITCH_TABS} value={value} onChange={onChange} />
  );
}
