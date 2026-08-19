import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter, usePathname } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MatchHeroGallery } from '@/components/paw/match-hero-gallery';
import { MatchWaveComposeModal } from '@/components/paw/match-wave-compose-modal';
import {
  bioForFocus,
  locationLabel,
  MATCH_WAVE_DEFAULT_MESSAGE,
  type MatchFeedFocus,
} from '@/constants/match-feed';
import { useMainTabNav } from '@/context/main-tab-nav';
import { usePawTooltip, tooltipMessageFromError } from '@/context/paw-tooltip';
import { useMatchFeed } from '@/hooks/use-match-feed';
import * as chatApi from '@/lib/api/chat';
import * as matchApi from '@/lib/api/match';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';

const REACTION_ICON_SIZE = 40;

function LocationGate({ onEnable }: { onEnable: () => void }) {
  return (
    <View style={styles.gateCard}>
      <Text style={styles.gateTitle}>Location access needed</Text>
      <Text style={styles.gateHint}>
        Allow location so we can find compatible pet parents near you.
      </Text>
      <Pressable style={styles.gateButton} onPress={onEnable} accessibilityRole="button">
        <Text style={styles.gateButtonText}>Enable location</Text>
      </Pressable>
    </View>
  );
}

export function MatchFeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab } = useMainTabNav();
  const { showTooltip } = usePawTooltip();
  const enabled = activeTab === 'find' && pathname === '/match-feed';

  const {
    permission,
    requestLocationAccess,
    current,
    loading,
    radiusKm,
    passCurrent,
    refreshing,
    refreshMatchFeed,
  } = useMatchFeed({ enabled });

  const [focus, setFocus] = useState<MatchFeedFocus>('pet');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [waveOpen, setWaveOpen] = useState(false);
  const [waveMessage, setWaveMessage] = useState(MATCH_WAVE_DEFAULT_MESSAGE);
  const [actionBusy, setActionBusy] = useState(false);

  const resetGallery = useCallback(() => {
    setFocus('pet');
    setPhotoIndex(0);
  }, []);

  useEffect(() => {
    resetGallery();
  }, [current?.id, resetGallery]);

  const handlePass = useCallback(async () => {
    if (!current || actionBusy) return;
    setActionBusy(true);
    try {
      await passCurrent();
      resetGallery();
    } finally {
      setActionBusy(false);
    }
  }, [current, actionBusy, passCurrent, resetGallery]);

  const openChat = useCallback(
    async (initialMessage?: string) => {
      if (!current) return;
      const conversation = await chatApi.startConversationWithProfile({
        id: current.id,
        handle: current.handle,
      });
      if (initialMessage?.trim()) {
        await chatApi.sendMessage(conversation.id, { content: initialMessage.trim() });
      }
      router.push(`/chat/${conversation.id}`);
    },
    [current, router],
  );

  const handleMessagePress = useCallback(async () => {
    if (!current || actionBusy) return;
    setActionBusy(true);
    try {
      await openChat();
      await passCurrent();
      resetGallery();
    } catch (err) {
      showTooltip({
        title: 'Chat unavailable',
        message: tooltipMessageFromError(err, 'Could not open chat.'),
        variant: 'error',
      });
    } finally {
      setActionBusy(false);
    }
  }, [current, actionBusy, openChat, passCurrent, resetGallery, showTooltip]);

  const handleWaveSend = useCallback(async () => {
    if (!current || actionBusy) return;
    setActionBusy(true);
    try {
      await matchApi.sendMatchWave({
        recipientId: current.id,
        handle: current.handle,
        message: waveMessage,
      });
      setWaveOpen(false);
      setWaveMessage(MATCH_WAVE_DEFAULT_MESSAGE);
      await passCurrent();
      resetGallery();
      showTooltip({
        title: 'Wave sent!',
        message: `Your message was sent and a friend request went to ${current.ownerFirstName}.`,
        variant: 'success',
        durationMs: 2800,
      });
    } catch (err) {
      showTooltip({
        title: 'Could not send wave',
        message: tooltipMessageFromError(err, 'Try again in a moment.'),
        variant: 'error',
      });
    } finally {
      setActionBusy(false);
    }
  }, [
    current,
    actionBusy,
    waveMessage,
    passCurrent,
    resetGallery,
    showTooltip,
  ]);

  const showLocationGate = permission === 'blocked';
  const showLoading = permission === 'loading' || loading;

  if (showLocationGate) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LocationGate onEnable={() => void requestLocationAccess()} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refreshMatchFeed()}
            tintColor={PawColors.navLabelActive}
            colors={[PawColors.peachBorder]}
            progressBackgroundColor={PawColors.creamBg}
          />
        }>
        {showLoading ? (
          <ActivityIndicator color={PawColors.peachBorder} style={styles.loader} />
        ) : null}

        {!showLoading && current ? (
          <>
            <MatchHeroGallery
              card={current}
              focus={focus}
              photoIndex={photoIndex}
              onFocusChange={setFocus}
              onPhotoIndexChange={setPhotoIndex}
            />

            <View style={styles.profileFooter}>
              <View style={styles.profileTexts}>
                <Text style={styles.nameLine}>
                  <Text style={styles.nameBold}>{current.ownerFirstName}</Text>
                  {current.age != null ? (
                    <Text style={styles.nameLight}>, {current.age}</Text>
                  ) : null}
                </Text>
                <View style={styles.locationRow}>
                  <Feather name="map-pin" size={22} color={PawColors.black} />
                  <Text style={styles.locationText}>{locationLabel(current)}</Text>
                </View>
              </View>
              <View style={styles.badgesCol}>
                {current.interests.map((label) => (
                  <View key={label} style={styles.badgeFriend}>
                    <Text style={styles.badgeFriendText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.reactions}>
              <Pressable
                onPress={() => void handlePass()}
                disabled={actionBusy}
                style={styles.reactionCircle}
                accessibilityRole="button"
                accessibilityLabel="Pass">
                <MaterialCommunityIcons
                  name="close"
                  size={REACTION_ICON_SIZE}
                  color={PawColors.black}
                />
              </Pressable>
              <Pressable
                onPress={() => void handleMessagePress()}
                disabled={actionBusy}
                style={[styles.reactionCircle, styles.reactionMessage]}
                accessibilityRole="button"
                accessibilityLabel="Open chat">
                {actionBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <MaterialCommunityIcons
                    name="message-processing"
                    size={REACTION_ICON_SIZE}
                    color="#fff"
                  />
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  setWaveMessage(MATCH_WAVE_DEFAULT_MESSAGE);
                  setWaveOpen(true);
                }}
                disabled={actionBusy}
                style={[styles.reactionCircle, styles.reactionHi]}
                accessibilityRole="button"
                accessibilityLabel="Send wave">
                <MaterialCommunityIcons
                  name="hand-wave-outline"
                  size={REACTION_ICON_SIZE}
                  color="#fff"
                />
              </Pressable>
            </View>

            <View style={styles.about}>
              <Text style={styles.aboutTitle}>
                About {focus === 'pet' ? current.petName : current.ownerFirstName}
              </Text>
              <Text style={styles.aboutBody}>{bioForFocus(current, focus)}</Text>
            </View>
          </>
        ) : null}

        {!showLoading && !current ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No matches nearby</Text>
            <Text style={styles.emptyHint}>
              {radiusKm != null
                ? `We searched up to ${radiusKm} km. Try updating your profile or check Discover for everyone nearby.`
                : 'Complete your dog profile and interests, then try again.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <MatchWaveComposeModal
        visible={waveOpen}
        recipientName={current?.ownerFirstName ?? 'them'}
        message={waveMessage}
        busy={actionBusy}
        onChangeMessage={setWaveMessage}
        onClose={() => setWaveOpen(false)}
        onSend={() => void handleWaveSend()}
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
    paddingHorizontal: PawLayout.horizontalPadding,
  },
  loader: {
    paddingVertical: 48,
  },
  profileFooter: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: PawColors.whiteCard,
    borderWidth: 1.5,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusCard,
    padding: 16,
    width: '100%',
  },
  profileTexts: {
    gap: 12,
    flexShrink: 1,
  },
  nameLine: {
    fontSize: PawFontSize.profileName,
    color: PawColors.black,
  },
  nameBold: {
    fontWeight: '700',
  },
  nameLight: {
    fontWeight: '300',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
    flexShrink: 1,
  },
  badgesCol: {
    gap: 8,
    alignItems: 'flex-end',
    maxWidth: '46%',
  },
  badgeFriend: {
    backgroundColor: PawColors.reactionLavender,
    borderWidth: 0.7,
    borderColor: PawColors.black,
    borderRadius: PawLayout.borderRadiusPill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeFriendText: {
    fontSize: PawFontSize.caption,
    fontWeight: '300',
    color: PawColors.black,
    textAlign: 'center',
  },
  reactions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 25,
    marginTop: 28,
    marginBottom: 8,
  },
  reactionCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PawColors.black,
  },
  reactionMessage: {
    backgroundColor: PawColors.reactionGreen,
    borderColor: PawColors.black,
  },
  reactionHi: {
    backgroundColor: PawColors.reactionLavender,
    borderColor: PawColors.black,
  },
  about: {
    marginTop: 16,
    width: '100%',
    backgroundColor: PawColors.whiteCard,
    borderWidth: 1,
    borderColor: PawColors.black,
    borderRadius: 12,
    paddingHorizontal: 30,
    paddingVertical: 16,
    gap: 12,
  },
  aboutTitle: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.black,
  },
  aboutBody: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textMuted,
    textAlign: 'justify',
  },
  emptyWrap: {
    paddingVertical: 48,
    paddingHorizontal: 8,
    gap: 12,
  },
  emptyTitle: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.black,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  gateCard: {
    margin: PawLayout.horizontalPadding,
    marginTop: 24,
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
