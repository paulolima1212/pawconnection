import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { FeedPostApi } from '@/lib/api/types';

type FeedPostsContextValue = {
  /** Bumped after a post is created, edited, or deleted so the feed reloads on focus. */
  refreshNonce: number;
  /** Post to show at the top of the feed until the next reload merges. */
  pendingPost: FeedPostApi | null;
  pendingUpdated: FeedPostApi | null;
  pendingRemovedId: string | null;
  editingPost: FeedPostApi | null;
  notifyPostCreated: (post: FeedPostApi) => void;
  notifyPostUpdated: (post: FeedPostApi) => void;
  notifyPostDeleted: (postId: string) => void;
  clearPendingPost: () => void;
  beginPostEdit: (post: FeedPostApi) => void;
  clearPostEdit: () => void;
};

const FeedPostsContext = createContext<FeedPostsContextValue | null>(null);

export function FeedPostsProvider({ children }: { children: ReactNode }) {
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [pendingPost, setPendingPost] = useState<FeedPostApi | null>(null);
  const [pendingUpdated, setPendingUpdated] = useState<FeedPostApi | null>(null);
  const [pendingRemovedId, setPendingRemovedId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<FeedPostApi | null>(null);

  const notifyPostCreated = useCallback((post: FeedPostApi) => {
    setPendingPost(post);
    setRefreshNonce((n) => n + 1);
  }, []);

  const notifyPostUpdated = useCallback((post: FeedPostApi) => {
    setPendingUpdated(post);
    setRefreshNonce((n) => n + 1);
  }, []);

  const notifyPostDeleted = useCallback((postId: string) => {
    setPendingRemovedId(postId);
    setRefreshNonce((n) => n + 1);
  }, []);

  const clearPendingPost = useCallback(() => {
    setPendingPost(null);
    setPendingUpdated(null);
    setPendingRemovedId(null);
  }, []);

  const beginPostEdit = useCallback((post: FeedPostApi) => {
    setEditingPost(post);
  }, []);

  const clearPostEdit = useCallback(() => {
    setEditingPost(null);
  }, []);

  const value = useMemo(
    () => ({
      refreshNonce,
      pendingPost,
      pendingUpdated,
      pendingRemovedId,
      editingPost,
      notifyPostCreated,
      notifyPostUpdated,
      notifyPostDeleted,
      clearPendingPost,
      beginPostEdit,
      clearPostEdit,
    }),
    [
      refreshNonce,
      pendingPost,
      pendingUpdated,
      pendingRemovedId,
      editingPost,
      notifyPostCreated,
      notifyPostUpdated,
      notifyPostDeleted,
      clearPendingPost,
      beginPostEdit,
      clearPostEdit,
    ],
  );

  return <FeedPostsContext.Provider value={value}>{children}</FeedPostsContext.Provider>;
}

export function useFeedPosts() {
  const ctx = useContext(FeedPostsContext);
  if (!ctx) {
    throw new Error('useFeedPosts must be used within FeedPostsProvider');
  }
  return ctx;
}
