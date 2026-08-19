import { PawSegmentedSwitch } from '@/components/paw/paw-segmented-switch';

export type FeedMapMode = 'feed' | 'map';

const TABS = [
  { id: 'feed' as const, label: 'Feed' },
  { id: 'map' as const, label: 'Map' },
];

type FeedMapToggleProps = {
  mode: FeedMapMode;
  onChange: (mode: FeedMapMode) => void;
};

export function FeedMapToggle({ mode, onChange }: FeedMapToggleProps) {
  return <PawSegmentedSwitch variant="feed" tabs={TABS} value={mode} onChange={onChange} />;
}
