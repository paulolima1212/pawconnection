import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipOptionDropdown } from '@/components/paw/chip-option-dropdown';
import { InboxConversationItem } from '@/components/paw/inbox-conversation-item';
import { InboxMainSwitch, type InboxMainTab } from '@/components/paw/inbox-main-switch';
import { InboxRequestItem } from '@/components/paw/inbox-request-item';
import { InboxRequestSwitch } from '@/components/paw/inbox-request-switch';
import { PawLogo } from '@/components/paw/paw-logo';
import {
  filterInboxRequests,
  INBOX_REQUEST_FILTER_OPTIONS,
  type InboxRequest,
  type InboxRequestFilter,
  type InboxSwitchTab,
} from '@/constants/inbox-mocks';
import { PawColors, PawFontSize, PawLayout } from '@/constants/paw-styles';
import { useAuth } from '@/context/auth';
import { useInboxUnread } from '@/context/inbox-unread';
import { useMainTabNav } from '@/context/main-tab-nav';
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import * as inboxApi from '@/lib/api/inbox';
import { inboxQueryParams, mapInboxRequestFromApi } from '@/lib/api/inbox-mapper';

type RequestAction = { id: string; kind: 'confirm' | 'delete' };

export function InboxScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, userId } = useAuth();
  const { activeTab } = useMainTabNav();
  const {
    conversations,
    conversationsLoading,
    totalUnread,
    refreshConversations,
    clearConversationUnread,
  } = useInboxUnread();
  const [mainTab, setMainTab] = useState<InboxMainTab>('messages');
  const [switchTab, setSwitchTab] = useState<InboxSwitchTab>('connections');
  const [requestFilter, setRequestFilter] = useState<InboxRequestFilter>('all');
  const [requests, setRequests] = useState<InboxRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<RequestAction | null>(null);
  const { showTooltip } = usePawTooltip();

  const loadRequests = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setRequests([]);
      return;
    }
    setLoading(true);
    try {
      const params = inboxQueryParams(switchTab, requestFilter);
      const data = await inboxApi.listInboxRequests(params);
      setRequests(data.map((item) => mapInboxRequestFromApi(item, userId)));
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userId, switchTab, requestFilter]);

  useEffect(() => {
    if (activeTab === 'inbox') {
      void refreshConversations();
    }
  }, [activeTab, refreshConversations]);

  useEffect(() => {
    if (mainTab === 'requests') {
      void loadRequests();
    }
  }, [mainTab, loadRequests]);

  const visibleRequests = useMemo(
    () => filterInboxRequests(requests, switchTab, requestFilter),
    [requests, switchTab, requestFilter],
  );

  const friendConversations = useMemo(
    () => conversations.filter((c) => c.isFriend),
    [conversations],
  );

  const requestConversations = useMemo(
    () => conversations.filter((c) => !c.isFriend),
    [conversations],
  );

  const handleConfirm = async (id: string) => {
    setActiveAction({ id, kind: 'confirm' });
    try {
      await inboxApi.acceptInboxRequest(id);
      setRequests((prev) => prev.filter((request) => request.id !== id));
      void refreshConversations();
      showTooltip({
        variant: 'success',
        title: 'Connected!',
        message: 'Request confirmed. You can message them from your inbox.',
      });
    } catch (error) {
      showTooltip({
        variant: 'error',
        message: tooltipMessageFromError(error, 'Could not confirm this request.'),
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActiveAction({ id, kind: 'delete' });
    try {
      await inboxApi.rejectInboxRequest(id);
      setRequests((prev) => prev.filter((request) => request.id !== id));
    } catch (error) {
      showTooltip({
        variant: 'error',
        message: tooltipMessageFromError(error, 'Could not remove this request.'),
      });
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.logoRow}>
          <PawLogo variant="mark" width={182} height={114} />
        </View>

        <View style={styles.sectionPad}>
          <InboxMainSwitch
            value={mainTab}
            onChange={setMainTab}
            messagesUnreadCount={totalUnread}
          />
        </View>

        {mainTab === 'messages' ? (
          <View style={styles.list}>
            {conversationsLoading ? (
              <ActivityIndicator color={PawColors.peachBorder} style={styles.loader} />
            ) : conversations.length === 0 ? (
              <Text style={styles.emptyText}>
                {isAuthenticated
                  ? 'No conversations yet. Open a profile and tap the message icon.'
                  : 'Sign in to view your messages.'}
              </Text>
            ) : friendConversations.length === 0 ? (
              <Text style={styles.emptyText}>
                {isAuthenticated
                  ? 'No friend chats yet. Accept a request to move a conversation here.'
                  : 'Sign in to view your messages.'}
              </Text>
            ) : (
              friendConversations.map((conversation, index) => (
                <InboxConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  showDivider={index < friendConversations.length - 1}
                  onOpen={() => clearConversationUnread(conversation.id)}
                />
              ))
            )}
          </View>
        ) : (
          <>
            <View style={[styles.sectionPad, styles.requestsSwitchPad]}>
              <InboxRequestSwitch value={switchTab} onChange={setSwitchTab} />
            </View>

            <View style={styles.filterRow}>
              <ChipOptionDropdown<InboxRequestFilter>
                value={requestFilter}
                options={INBOX_REQUEST_FILTER_OPTIONS}
                onChange={setRequestFilter}
                sheetTitle="Requests"
                accessibilityLabel="Request filter"
                accessibilityHint="Filter all, incoming, or outgoing requests"
              />
            </View>

            <View style={styles.list}>
              {loading ? (
                <ActivityIndicator color={PawColors.peachBorder} style={styles.loader} />
              ) : null}

              {requestConversations.length > 0 ? (
                <View style={styles.requestSection}>
                  <Text style={styles.requestSectionTitle}>Message requests</Text>
                  {requestConversations.map((conversation, index) => (
                    <InboxConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      showDivider={index < requestConversations.length - 1}
                      onOpen={() => clearConversationUnread(conversation.id)}
                    />
                  ))}
                </View>
              ) : null}

              {visibleRequests.length > 0 ? (
                <View style={styles.requestSection}>
                  {requestConversations.length > 0 ? (
                    <Text style={styles.requestSectionTitle}>Connection requests</Text>
                  ) : null}
                  {visibleRequests.map((request, index) => (
                    <InboxRequestItem
                      key={request.id}
                      request={request}
                      canConfirm={request.filter === 'incoming'}
                      confirmBusy={activeAction?.id === request.id && activeAction.kind === 'confirm'}
                      deleteBusy={activeAction?.id === request.id && activeAction.kind === 'delete'}
                      onConfirm={(requestId) => void handleConfirm(requestId)}
                      onDelete={(requestId) => void handleDelete(requestId)}
                      showDivider={index < visibleRequests.length - 1}
                    />
                  ))}
                </View>
              ) : null}

              {!loading &&
              requestConversations.length === 0 &&
              visibleRequests.length === 0 ? (
                <Text style={styles.emptyText}>
                  {isAuthenticated ? 'No requests yet.' : 'Sign in to view your inbox.'}
                </Text>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
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
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionPad: {
    paddingHorizontal: PawLayout.horizontalPadding,
  },
  requestsSwitchPad: {
    marginTop: 16,
  },
  logoRow: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
    minHeight: 114,
    paddingHorizontal: PawLayout.horizontalPadding,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: PawLayout.horizontalPadding,
  },
  list: {
    gap: 24,
    marginTop: 8,
    paddingHorizontal: PawLayout.horizontalPadding,
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    fontSize: PawFontSize.body,
    fontWeight: '300',
    color: PawColors.textMuted,
    textAlign: 'center',
    marginTop: 32,
  },
  requestSection: {
    gap: 8,
    marginBottom: 8,
  },
  requestSectionTitle: {
    fontSize: PawFontSize.body,
    fontWeight: '700',
    color: PawColors.black,
    marginBottom: 4,
  },
});
