import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

type IconName = ComponentProps<typeof Feather>['name'];

export function PublicProfileHeroBand({ children }: { children: ReactNode }) {
  return (
    <View style={styles.heroBand}>
      <View style={styles.heroInner}>{children}</View>
    </View>
  );
}

export function PublicProfileHandleBadge({ handle }: { handle: string }) {
  const display = handle.startsWith('@') ? handle : `@${handle}`;
  return (
    <View style={styles.handleBadge}>
      <Text style={styles.handleText}>{display}</Text>
    </View>
  );
}

export function PublicProfileLocationChip({ location }: { location: string }) {
  return (
    <View style={styles.locationChip}>
      <Feather name="map-pin" size={14} color={PawColors.profileBrown} />
      <Text style={styles.locationText} numberOfLines={1}>
        {location}
      </Text>
    </View>
  );
}

export function PublicProfileVerifiedTitle({ name }: { name: string }) {
  return (
    <View style={styles.titleRow}>
      <Text style={styles.heroPetName} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.verifiedBadge} accessibilityLabel="Verified">
        <MaterialCommunityIcons name="check-decagram" size={22} color={PawColors.badgeBlue} />
      </View>
    </View>
  );
}

export function PublicProfileSectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function PublicProfileDetailRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  if (!value.trim()) return null;
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <Feather name={icon} size={16} color={PawColors.black} />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export function PublicProfileBioBlock({ text }: { text: string }) {
  if (!text.trim()) return null;
  return <Text style={styles.bioText}>{text}</Text>;
}

export function PublicProfileChipGrid({ items }: { items: string[] }) {
  const visible = items.filter((i) => i.trim());
  if (!visible.length) return null;
  return (
    <View style={styles.chipGrid}>
      {visible.map((item) => (
        <View key={item} style={styles.chip}>
          <Text style={styles.chipText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function PublicProfileEnjoyRow({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <View style={[styles.enjoyPill, active && styles.enjoyPillActive]}>
      <Feather
        name={active ? 'check-circle' : 'circle'}
        size={16}
        color={active ? PawColors.profileBrown : PawColors.chipGray}
      />
      <Text style={[styles.enjoyText, active && styles.enjoyTextActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBand: {
    backgroundColor: PawColors.peachBorder,
    borderBottomWidth: 1,
    borderColor: PawColors.black,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroInner: {
    alignItems: 'center',
    width: '100%',
  },
  handleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: PawLayout.borderRadiusPill,
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 1,
    borderColor: PawColors.black,
  },
  handleText: {
    fontSize: PawFontSize.small,
    fontWeight: '600',
    color: PawColors.profileBrown,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  heroPetName: {
    fontSize: 26,
    fontWeight: '700',
    color: PawColors.profileBrown,
    lineHeight: 32,
    textAlign: 'center',
  },
  verifiedBadge: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '90%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: PawLayout.borderRadiusPill,
    backgroundColor: PawColors.whiteCard,
    borderWidth: 1,
    borderColor: PawColors.black,
  },
  locationText: {
    fontSize: PawFontSize.small,
    fontWeight: '400',
    color: PawColors.profileBrown,
    flexShrink: 1,
  },
  sectionCard: {
    backgroundColor: PawColors.whiteCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PawColors.black,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.black,
  },
  sectionBody: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PawColors.black,
    backgroundColor: PawColors.fieldWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: PawFontSize.caption,
    fontWeight: '400',
    color: PawColors.textMuted,
  },
  detailValue: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
  bioText: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    lineHeight: PawLineHeight.body,
    color: PawColors.textMuted,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: PawLayout.borderRadiusPill,
    backgroundColor: PawColors.profileTipBg,
    borderWidth: 1,
    borderColor: PawColors.reactionLavender,
  },
  chipText: {
    fontSize: PawFontSize.small,
    fontWeight: '500',
    color: PawColors.profileBrown,
  },
  enjoyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: PawLayout.borderRadiusField,
    borderWidth: 1,
    borderColor: PawColors.profileHeaderBorder,
    backgroundColor: PawColors.fieldWhite,
  },
  enjoyPillActive: {
    borderColor: PawColors.black,
    backgroundColor: PawColors.profileTipBg,
  },
  enjoyText: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.chipGray,
  },
  enjoyTextActive: {
    fontWeight: '600',
    color: PawColors.profileBrown,
  },
});
