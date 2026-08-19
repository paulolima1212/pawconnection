import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileDualPicture } from '@/components/paw/profile-dual-picture';
import type { InboxRequest } from '@/constants/inbox-mocks';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type InboxRequestItemProps = {
  request: InboxRequest;
  canConfirm?: boolean;
  confirmBusy?: boolean;
  deleteBusy?: boolean;
  onConfirm?: (id: string) => void;
  onDelete?: (id: string) => void;
  showDivider?: boolean;
};

function categoryLabel(switchTab: InboxRequest['switchTab']): string {
  if (switchTab === 'connections') return 'Connection';
  return 'Request';
}

export function InboxRequestItem({
  request,
  canConfirm = false,
  confirmBusy = false,
  deleteBusy = false,
  onConfirm,
  onDelete,
  showDivider = true,
}: InboxRequestItemProps) {
  const actionsBusy = confirmBusy || deleteBusy;

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <View style={styles.profileRow}>
          <ProfileDualPicture dogAvatar={request.dogAvatar} humanAvatar={request.humanAvatar} />
          <View style={styles.names}>
            <Text style={styles.dogName}>{request.dogName}</Text>
            <Text style={styles.ownerName}>{request.ownerName}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          {canConfirm ? (
            <Pressable
              onPress={() => onConfirm?.(request.id)}
              disabled={!onConfirm || actionsBusy}
              style={({ pressed }) => [
                styles.confirmBtn,
                actionsBusy && styles.btnDisabled,
                pressed && !actionsBusy && styles.btnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Confirm request from ${request.dogName}`}>
              {confirmBusy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmText}>Confirm</Text>
              )}
            </Pressable>
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Sent</Text>
            </View>
          )}
          <Pressable
            onPress={() => onDelete?.(request.id)}
            disabled={!onDelete || actionsBusy}
            style={({ pressed }) => [
              styles.deleteBtn,
              actionsBusy && styles.btnDisabled,
              pressed && !actionsBusy && styles.btnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              canConfirm
                ? `Delete request from ${request.dogName}`
                : `Cancel request to ${request.dogName}`
            }>
            {deleteBusy ? (
              <ActivityIndicator size="small" color={PawColors.black} />
            ) : (
              <Text style={styles.deleteText}>{canConfirm ? 'Delete' : 'Cancel'}</Text>
            )}
          </Pressable>
        </View>
      </View>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{categoryLabel(request.switchTab)}</Text>
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  profileRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minWidth: 0,
  },
  names: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    minWidth: 0,
  },
  dogName: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '600',
    color: PawColors.chipGray,
  },
  ownerName: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '400',
    color: PawColors.chipGray,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flexShrink: 0,
    paddingTop: 4,
  },
  confirmBtn: {
    backgroundColor: PawColors.reactionGreen,
    borderWidth: 2,
    borderColor: PawColors.black,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 78,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 64,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  pendingBadge: {
    backgroundColor: PawColors.fieldGray,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 78,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingText: {
    fontSize: PawFontSize.small,
    fontWeight: '600',
    color: PawColors.textMuted,
    lineHeight: PawLineHeight.small,
  },
  confirmText: {
    fontSize: PawFontSize.small,
    fontWeight: '700',
    color: '#fff',
    lineHeight: PawLineHeight.small,
  },
  deleteText: {
    fontSize: PawFontSize.small,
    fontWeight: '300',
    color: PawColors.black,
    lineHeight: PawLineHeight.small,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: PawColors.reactionLavender,
    borderWidth: 0.7,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusPill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    height: 30,
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: PawFontSize.body,
    lineHeight: PawLineHeight.body,
    fontWeight: '300',
    color: PawColors.black,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: PawColors.chipGray,
    opacity: 0.35,
  },
});
