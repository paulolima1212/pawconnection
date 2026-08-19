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
  /** Bumped after a post is created so the feed reloads on focus. */
  refreshNonce: number;
  /** Post to show at the top of the feed until the next reload merges. */
  pendingPost: FeedPostApi | null;
  notifyPostCreated: (post: FeedPostApi) => void;
  clearPendingPost: () => void;
};

const FeedPostsContext = createContext<FeedPostsContextValue | null>(null);

export function FeedPostsProvider({ children }: { children: ReactNode }) {
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [pendingPost, setPendingPost] = useState<FeedPostApi | null>(null);

  const notifyPostCreated = useCallback((post: FeedPostApi) => {
    setPendingPost(post);
    setRefreshNonce((n) => n + 1);
  }, []);

  const clearPendingPost = useCallback(() => {
    setPendingPost(null);
  }, []);

  const value = useMemo(
    () => ({
      refreshNonce,
      pendingPost,
      notifyPostCreated,
      clearPendingPost,
    }),
    [refreshNonce, pendingPost, notifyPostCreated, clearPendingPost],
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
