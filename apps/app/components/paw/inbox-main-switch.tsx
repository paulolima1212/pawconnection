import { StyleSheet, View } from 'react-native';

import { PawSegmentedSwitch } from '@/components/paw/paw-segmented-switch';
import { PawColors } from '@/constants/paw-styles';

export type InboxMainTab = 'messages' | 'requests';

const TABS: { id: InboxMainTab; label: string }[] = [
  { id: 'messages', label: 'Messages' },
  { id: 'requests', label: 'Requests' },
];

type InboxMainSwitchProps = {
  value: InboxMainTab;
  onChange: (value: InboxMainTab) => void;
  messagesUnreadCount?: number;
};

export function InboxMainSwitch({
  value,
  onChange,
  messagesUnreadCount = 0,
}: InboxMainSwitchProps) {
  const showMessagesBadge = messagesUnreadCount > 0 && value !== 'messages';

  return (
    <View style={styles.wrap}>
      <PawSegmentedSwitch variant="inbox" tabs={TABS} value={value} onChange={onChange} />
      {showMessagesBadge ? (
        <View style={styles.messagesBadge}>
          <View style={styles.messagesBadgeDot} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  messagesBadge: {
    position: 'absolute',
    left: '25%',
    top: 6,
    marginLeft: 36,
    pointerEvents: 'none',
  },
  messagesBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PawColors.peachBorder,
    borderWidth: 1,
    borderColor: PawColors.black,
  },
});
