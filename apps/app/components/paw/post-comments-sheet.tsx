import Feather from '@expo/vector-icons/Feather';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentActionSheet } from '@/components/paw/comment-action-sheet';
import { useKeyboardAwareBottomPadding } from '@/components/paw/keyboard-aware-form-scroll';
import { RemoteMediaImage } from '@/components/paw/remote-media-image';
import { PawColors, PawFontSize, PawLayout, PawLineHeight } from '@/constants/paw-styles';
import { useAuth } from '@/context/auth';
import { tooltipMessageFromError, usePawTooltip } from '@/context/paw-tooltip';
import { ApiError } from '@/lib/api/client';
import * as commentsApi from '@/lib/api/comments';
import type { CommentApi, CommentTreeApi } from '@/lib/api/types';

type PostCommentsSheetProps = {
  visible: boolean;
  postId: string;
  postLabel?: string;
  onClose: () => void;
  onCountChange?: (count: number) => void;
};

function formatCommentTime(iso: string): string {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function authorLabel(c: CommentApi): string {
  if (c.deleted || !c.author) return 'Deleted';
  const pet = c.author.petName;
  return pet ? `${pet} · ${c.author.fullName}` : c.author.fullName;
}

type CommentRowProps = {
  comment: CommentApi;
  depth?: number;
  currentUserId: string | null;
  startEditId?: string | null;
  onEditStarted?: () => void;
  onReply: (comment: CommentApi) => void;
  onRefresh: () => void;
  onOpenMenu: (comment: CommentApi) => void;
};

function CommentRow({
  comment,
  depth = 0,
  currentUserId,
  startEditId,
  onEditStarted,
  onReply,
  onRefresh,
  onOpenMenu,
}: CommentRowProps) {
  const { showTooltip } = usePawTooltip();
  const isOwn = currentUserId === comment.authorId && !comment.deleted;
  const photo = comment.author?.petPhotoUrl ?? comment.author?.photoUrl;
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (startEditId === comment.id) {
      setEditDraft(comment.content);
      setEditing(true);
      onEditStarted?.();
    }
  }, [startEditId, comment.id, comment.content, onEditStarted]);

  const saveEdit = async () => {
    const trimmed = editDraft.trim();
    if (!trimmed || savingEdit) return;
    setSavingEdit(true);
    try {
      await commentsApi.updateComment(comment.id, trimmed);
      setEditing(false);
      onRefresh();
    } catch (err) {
      showTooltip({
        title: 'Could not edit',
        message: tooltipMessageFromError(err, 'Try again.'),
        variant: 'error',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <View style={[styles.commentRow, depth > 0 && styles.commentRowNested]}>
      {photo && !comment.deleted ? (
        <RemoteMediaImage uri={photo} style={styles.commentAvatar} contentFit="cover" />
      ) : (
        <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
          <Feather name="message-circle" size={14} color={PawColors.chipGray} />
        </View>
      )}
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor} numberOfLines={1}>
            {authorLabel(comment)}
          </Text>
          <Text style={styles.commentTime}>{formatCommentTime(comment.createdAt)}</Text>
          {comment.edited ? <Text style={styles.editedBadge}>edited</Text> : null}
        </View>
        {editing ? (
          <View style={styles.editBlock}>
            <TextInput
              value={editDraft}
              onChangeText={setEditDraft}
              style={styles.editInput}
              multiline
              maxLength={2000}
              autoFocus
            />
            <View style={styles.editActions}>
              <Pressable onPress={() => setEditing(false)} hitSlop={6}>
                <Text style={styles.editCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void saveEdit()}
                disabled={!editDraft.trim() || savingEdit}
                hitSlop={6}>
                <Text style={styles.editSave}>Save</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={[styles.commentText, comment.deleted && styles.commentTextDeleted]}>
            {comment.content}
          </Text>
        )}
        {!comment.deleted && !editing ? (
          <View style={styles.commentActions}>
            <Pressable
              onPress={() => onReply(comment)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Reply">
              <Text style={styles.replyLink}>Reply</Text>
            </Pressable>
            {isOwn ? (
              <Pressable
                onPress={() => onOpenMenu(comment)}
                hitSlop={6}
                accessibilityLabel="More options">
                <Feather name="more-horizontal" size={16} color={PawColors.chipGray} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function PostCommentsSheet({
  visible,
  postId,
  postLabel,
  onClose,
  onCountChange,
}: PostCommentsSheetProps) {
  const insets = useSafeAreaInsets();
  const keyboardPad = useKeyboardAwareBottomPadding(Math.max(12, insets.bottom + 8));
  const { userId } = useAuth();
  const { showTooltip } = usePawTooltip();
  const [items, setItems] = useState<CommentTreeApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<CommentApi | null>(null);
  const [menuTarget, setMenuTarget] = useState<CommentApi | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const onCountChangeRef = useRef(onCountChange);
  onCountChangeRef.current = onCountChange;

  const handleConfirmDelete = async () => {
    if (!menuTarget) return;
    setDeleting(true);
    try {
      await commentsApi.deleteComment(menuTarget.id);
      setMenuTarget(null);
      setConfirmDelete(false);
      await load();
    } catch (err) {
      showTooltip({
        title: 'Could not delete',
        message: tooltipMessageFromError(err, 'Try again.'),
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const [page, countRes] = await Promise.all([
        commentsApi.listPostComments(postId, { order: 'newest' }),
        commentsApi.countPostComments(postId),
      ]);
      setItems(page.items);
      onCountChangeRef.current?.(countRes.count);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 429
          ? 'Too many requests. Wait a moment and try again.'
          : err instanceof ApiError
            ? err.message
            : 'Could not load comments.';
      showTooltip({
        title: 'Comments',
        message: tooltipMessageFromError(err, message),
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [postId, showTooltip]);

  useEffect(() => {
    if (visible) {
      setReplyTo(null);
      setDraft('');
      void load();
    }
  }, [visible, load]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (replyTo) {
        await commentsApi.replyToComment(replyTo.id, text);
      } else {
        await commentsApi.createPostComment(postId, text);
      }
      setDraft('');
      setReplyTo(null);
      await load();
    } catch (err) {
      showTooltip({
        title: 'Could not post',
        message: tooltipMessageFromError(err, 'Try again.'),
        variant: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={[StyleSheet.absoluteFillObject, styles.dim]} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: keyboardPad }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Comments</Text>
              {postLabel ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {postLabel}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close comments">
              <Feather name="x" size={24} color={PawColors.black} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={PawColors.peachBorder} />
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {items.length === 0 ? (
                <Text style={styles.empty}>No comments yet. Start the conversation!</Text>
              ) : (
                items.map((tree) => (
                  <View key={tree.id} style={styles.thread}>
                    <CommentRow
                      comment={tree}
                      currentUserId={userId}
                      startEditId={editCommentId}
                      onEditStarted={() => setEditCommentId(null)}
                      onReply={setReplyTo}
                      onRefresh={() => void load()}
                      onOpenMenu={(c) => {
                        setConfirmDelete(false);
                        setMenuTarget(c);
                      }}
                    />
                    {tree.replies.map((reply) => (
                      <CommentRow
                        key={reply.id}
                        comment={reply}
                        depth={1}
                        currentUserId={userId}
                        startEditId={editCommentId}
                        onEditStarted={() => setEditCommentId(null)}
                        onReply={setReplyTo}
                        onRefresh={() => void load()}
                        onOpenMenu={(c) => {
                          setConfirmDelete(false);
                          setMenuTarget(c);
                        }}
                      />
                    ))}
                    {tree.hasMoreReplies ? (
                      <Text style={styles.moreReplies}>
                        {tree.replyCount - tree.replies.length} more{' '}
                        {tree.replyCount - tree.replies.length === 1 ? 'reply' : 'replies'}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {replyTo ? (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText} numberOfLines={1}>
                Replying to {authorLabel(replyTo)}
              </Text>
              <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                <Feather name="x" size={18} color={PawColors.chipGray} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={replyTo ? 'Write a reply…' : 'Add a comment…'}
              placeholderTextColor={PawColors.searchPlaceholder}
              style={styles.input}
              multiline
              maxLength={2000}
              accessibilityLabel="Comment text"
            />
            <Pressable
              onPress={() => void submit()}
              disabled={!draft.trim() || sending}
              style={({ pressed }) => [
                styles.sendBtn,
                (!draft.trim() || sending) && styles.sendBtnDisabled,
                pressed && draft.trim() && styles.sendBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send comment">
              {sending ? (
                <ActivityIndicator size="small" color={PawColors.fieldWhite} />
              ) : (
                <Feather name="send" size={18} color={PawColors.fieldWhite} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>

    <CommentActionSheet
      visible={menuTarget !== null}
      authorName={menuTarget ? authorLabel(menuTarget) : ''}
      commentPreview={menuTarget?.content ?? ''}
      confirmDelete={confirmDelete}
      deleting={deleting}
      onClose={() => {
        if (!deleting) {
          setMenuTarget(null);
          setConfirmDelete(false);
        }
      }}
      onSelect={(action) => {
        if (!menuTarget) return;
        if (action === 'edit') {
          setMenuTarget(null);
          setConfirmDelete(false);
          setEditCommentId(menuTarget.id);
          return;
        }
        setConfirmDelete(true);
      }}
      onConfirmDelete={() => void handleConfirmDelete()}
    />
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: PawColors.creamBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PawColors.peachBorder,
  },
  title: {
    fontSize: PawFontSize.subtitle,
    fontWeight: '700',
    color: PawColors.black,
    lineHeight: PawLineHeight.subtitle,
  },
  subtitle: {
    marginTop: 2,
    fontSize: PawFontSize.small,
    color: PawColors.chipGray,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingVertical: 12,
    gap: 16,
  },
  empty: {
    textAlign: 'center',
    color: PawColors.chipGray,
    fontSize: PawFontSize.body,
    paddingVertical: 24,
  },
  thread: {
    gap: 8,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  commentRowNested: {
    marginLeft: 36,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PawColors.fieldWhite,
  },
  commentAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PawColors.peachBorder,
  },
  commentBody: {
    flex: 1,
    gap: 4,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  commentAuthor: {
    fontSize: PawFontSize.small,
    fontWeight: '600',
    color: PawColors.black,
    flexShrink: 1,
  },
  commentTime: {
    fontSize: PawFontSize.caption,
    color: PawColors.chipGray,
  },
  editedBadge: {
    fontSize: PawFontSize.caption,
    color: PawColors.chipGray,
    fontStyle: 'italic',
  },
  commentText: {
    fontSize: PawFontSize.body,
    color: PawColors.black,
    lineHeight: PawLineHeight.body,
  },
  commentTextDeleted: {
    color: PawColors.chipGray,
    fontStyle: 'italic',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  replyLink: {
    fontSize: PawFontSize.small,
    fontWeight: '600',
    color: PawColors.profileBrown,
  },
  moreReplies: {
    marginLeft: 46,
    fontSize: PawFontSize.small,
    color: PawColors.chipGray,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: PawLayout.horizontalPadding,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: PawLayout.borderRadiusField,
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 1,
    borderColor: PawColors.peachBorder,
  },
  replyBannerText: {
    flex: 1,
    fontSize: PawFontSize.small,
    color: PawColors.profileBrown,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: PawLayout.horizontalPadding,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PawColors.peachBorder,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: PawLayout.borderRadiusField,
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 1,
    borderColor: PawColors.peachBorder,
    fontSize: PawFontSize.body,
    color: PawColors.black,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PawColors.peachBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
  sendBtnPressed: {
    opacity: 0.85,
  },
  editBlock: {
    gap: 8,
  },
  editInput: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: PawLayout.borderRadiusField,
    backgroundColor: PawColors.fieldWhite,
    borderWidth: 1,
    borderColor: PawColors.peachBorder,
    fontSize: PawFontSize.body,
    color: PawColors.black,
    minHeight: 44,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  editCancel: {
    fontSize: PawFontSize.small,
    color: PawColors.chipGray,
    fontWeight: '600',
  },
  editSave: {
    fontSize: PawFontSize.small,
    color: PawColors.profileBrown,
    fontWeight: '700',
  },
});
