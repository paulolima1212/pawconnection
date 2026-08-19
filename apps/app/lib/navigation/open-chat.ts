import type { Href, Router } from 'expo-router';

export type ChatOrigin = 'inbox' | 'profile' | 'feed';

const ORIGIN_TO_ROUTE: Partial<Record<ChatOrigin, Href>> = {
  inbox: '/inbox',
  feed: '/social-feed',
};

let pendingReturnRoute: Href | null = null;

export function openChat(router: Router, conversationId: string, from: ChatOrigin): void {
  pendingReturnRoute = ORIGIN_TO_ROUTE[from] ?? null;
  router.push(`/chat/${conversationId}?from=${from}`);
}

export function exitChatRoute(from?: string | string[]): Href {
  const origin = Array.isArray(from) ? from[0] : from;
  if (origin === 'inbox') return '/inbox';
  if (origin === 'feed') return '/social-feed';
  if (pendingReturnRoute) {
    const route = pendingReturnRoute;
    pendingReturnRoute = null;
    return route;
  }
  return '/inbox';
}

export function clearChatReturnRoute(): void {
  pendingReturnRoute = null;
}

export function shouldExitChatWithBack(from?: string | string[]): boolean {
  const origin = Array.isArray(from) ? from[0] : from;
  return origin === 'profile';
}
