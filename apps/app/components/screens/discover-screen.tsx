import Feather from '@expo/vector-icons/Feather';
import { useRouter, usePathname } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipOptionDropdown } from '@/components/paw/chip-option-dropdown';
import { DiscoverAdvancedFiltersSheet } from '@/components/paw/discover-advanced-filters-sheet';
import { DiscoverConnectModal } from '@/components/paw/discover-connect-modal';
import { DiscoverUserCard } from '@/components/paw/discover-user-card';
import { PawLogo } from '@/components/paw/paw-logo';
import {
  DISCOVER_AGE_FILTER_OPTIONS,
  DISCOVER_DISTANCE_FILTER_OPTIONS,
  DISCOVER_PET_TYPE_FILTER_OPTIONS,
  type DiscoverAgeFilter,
  type DiscoverDistanceFilter,
  type DiscoverPerson,
  type DiscoverPetTypeFilter,
} from '@/constants/discover';
import { useMainTabNav } from '@/context/main-tab-nav';
import {
  DEFAULT_DISCOVER_ADVANCED_FILTERS,
  useDiscoverPeople,
  type DiscoverAdvancedFilters,
} from '@/hooks/use-discover-people';
import { openUserProfile } from '@/lib/navigation/open-user-profile';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';

function LocationGate({
  onEnable,
}: {
  onEnable: () => void;
}) {
  return (
    <View style={styles.gateCard}>
      <Text style={styles.gateTitle}>Location access needed</Text>
      <Text style={styles.gateHint}>
        Allow location so we can show pet parents near you and calculate distance.
      </Text>
      <Pressable style={styles.gateButton} onPress={onEnable} accessibilityRole="button">
        <Text style={styles.gateButtonText}>Enable location</Text>
      </Pressable>
    </View>
  );
}

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab } = useMainTabNav();
  const enabled = activeTab === 'discover' && pathname === '/discover';

  const [search, setSearch] = useState('');
  const [ageFilter, setAgeFilter] = useState<DiscoverAgeFilter>('18-25');
  const [petTypeFilter, setPetTypeFilter] = useState<DiscoverPetTypeFilter>('dogs');
  const [distanceFilter, setDistanceFilter] = useState<DiscoverDistanceFilter>('5');
  const [advancedFilters, setAdvancedFilters] = useState<DiscoverAdvancedFilters>(
    DEFAULT_DISCOVER_ADVANCED_FILTERS,
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [connectTarget, setConnectTarget] = useState<DiscoverPerson | null>(null);

  const {
    permission,
    usersLoading,
    requestLocationAccess,
    visiblePeople,
    peopleCount,
    excludePerson,
    sendConnection,
    connectingId,
    isPendingConnection,
    refreshing,
    refreshPeople,
  } = useDiscoverPeople({
    enabled,
    search,
    ageFilter,
    petTypeFilter,
    distanceFilter,
    advancedFilters,
  });

  const handleConnectSelect = useCallback(async () => {
    if (!connectTarget) return;
    try {
      await sendConnection(connectTarget.id);
      setConnectTarget(null);
    } catch {
      /* keep modal open — caller may add toast later */
    }
  }, [connectTarget, sendConnection]);

  const showLocationGate = permission === 'blocked';
  const showLoading = permission === 'loading' || (permission === 'ready' && usersLoading && visiblePeople.length === 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          !showLocationGate ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refreshPeople()}
              tintColor={PawColors.navLabelActive}
              colors={[PawColors.peachBorder]}
              progressBackgroundColor={PawColors.creamBg}
            />
          ) : undefined
        }>
        <View style={styles.logoRow}>
          <PawLogo variant="mark" width={182} height={114} />
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchField}>
            <Feather name="search" size={24} color={PawColors.black} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name..."
              placeholderTextColor={PawColors.black}
              style={styles.searchInput}
              accessibilityLabel="Search by name"
              editable={!showLocationGate}
            />
            <Pressable
              onPress={() => setAdvancedOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Advanced filters">
              <Feather name="sliders" size={22} color={PawColors.black} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}>
            <ChipOptionDropdown
              value={ageFilter}
              options={DISCOVER_AGE_FILTER_OPTIONS}
              onChange={setAgeFilter}
              sheetTitle="Age range"
              accessibilityLabel="Age range filter"
            />
            <ChipOptionDropdown
              value={petTypeFilter}
              options={DISCOVER_PET_TYPE_FILTER_OPTIONS}
              onChange={setPetTypeFilter}
              sheetTitle="Pet type"
              accessibilityLabel="Pet type filter"
            />
            <ChipOptionDropdown
              value={distanceFilter}
              options={DISCOVER_DISTANCE_FILTER_OPTIONS}
              onChange={setDistanceFilter}
              sheetTitle="Distance"
              accessibilityLabel="Distance filter"
            />
          </ScrollView>
        </View>

        {showLocationGate ? (
          <LocationGate onEnable={() => void requestLocationAccess()} />
        ) : null}

        {!showLocationGate ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>People near you</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{peopleCount}</Text>
              </View>
            </View>

            {showLoading ? (
              <ActivityIndicator color={PawColors.navLabelActive} style={styles.loader} />
            ) : null}

            <View style={styles.list}>
              {visiblePeople.map((person) => (
                <DiscoverUserCard
                  key={person.id}
                  person={person}
                  pending={isPendingConnection(person.id)}
                  connecting={connectingId === person.id}
                  onPress={() => openUserProfile(router, person.handle)}
                  onConnectPress={() => setConnectTarget(person)}
                  onExcludePress={() => void excludePerson(person.id)}
                />
              ))}
              {!showLoading && visiblePeople.length === 0 ? (
                <Text style={styles.emptyHint}>No people match your filters yet.</Text>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>

      <DiscoverAdvancedFiltersSheet
        visible={advancedOpen}
        value={advancedFilters}
        onChange={setAdvancedFilters}
        onClose={() => setAdvancedOpen(false)}
      />

      <DiscoverConnectModal
        visible={connectTarget != null}
        person={connectTarget}
        busy={connectingId != null}
        onClose={() => setConnectTarget(null)}
        onSelect={() => void handleConnectSelect()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PawColors.creamBg,
    maxWidth: PawLayout.screenMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  logoRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  searchSection: {
    paddingHorizontal: PawLayout.horizontalPadding,
    gap: 16,
    marginBottom: 4,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: PawColors.fieldGray,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusField,
  },
  searchInput: {
    flex: 1,
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
    paddingVertical: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PawColors.navLabel,
    letterSpacing: 0.22,
  },
  countBadge: {
    backgroundColor: PawColors.peachBorder,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: PawFontSize.small,
    fontWeight: '600',
    color: PawColors.black,
    lineHeight: PawLineHeight.small,
  },
  list: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingVertical: 12,
    gap: 16,
  },
  emptyHint: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  loader: {
    paddingVertical: 24,
  },
  gateCard: {
    marginHorizontal: PawLayout.horizontalPadding,
    marginTop: 8,
    padding: 20,
    backgroundColor: PawColors.whiteCard,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: 12,
    gap: 12,
  },
  gateTitle: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.black,
  },
  gateHint: {
    fontSize: PawFontSize.small,
    fontWeight: '300',
    color: PawColors.textMuted,
    lineHeight: 20,
  },
  gateButton: {
    alignSelf: 'flex-start',
    backgroundColor: PawColors.peachBorder,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusPill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  gateButtonText: {
    fontSize: PawFontSize.body,
    fontWeight: '600',
    color: PawColors.black,
  },
});
