import type { PawTabId } from '@/components/paw/bottom-tab-bar';
import { type Href, usePathname, useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { useContentWidth } from '@/hooks/use-content-width';

/** Tab pages in bottom bar order (Home → Find → Discover → Inbox → Profile). */
export const MAIN_TAB_PAGE_ORDER = ['home', 'find', 'discover', 'inbox', 'profile'] as const;
export type MainTabPageId = (typeof MAIN_TAB_PAGE_ORDER)[number];

const TAB_TO_PAGE: Record<PawTabId, MainTabPageId> = {
  home: 'home',
  find: 'find',
  discover: 'discover',
  inbox: 'inbox',
  profile: 'profile',
};

const PATH_TO_PAGE: Partial<Record<string, MainTabPageId>> = {
  '/social-feed': 'home',
  '/match-feed': 'find',
  '/discover': 'discover',
  '/inbox': 'inbox',
  '/profile': 'profile',
};

const TAB_TO_ROUTE: Record<PawTabId, Href> = {
  home: '/social-feed',
  find: '/match-feed',
  discover: '/discover',
  inbox: '/inbox',
  profile: '/profile',
};

const PATH_TO_TAB: Partial<Record<string, PawTabId>> = {
  '/social-feed': 'home',
  '/match-feed': 'find',
  '/discover': 'discover',
  '/inbox': 'inbox',
  '/profile': 'profile',
};

const SLIDE_MS = 280;

type MainTabNavContextValue = {
  activeTab: PawTabId;
  pageIndex: number;
  pageWidth: number;
  translateX: ReturnType<typeof useSharedValue<number>>;
  goToTab: (tab: PawTabId) => void;
};

const MainTabNavContext = createContext<MainTabNavContextValue | null>(null);

function pageIndexForTab(tab: PawTabId): number {
  const page = TAB_TO_PAGE[tab];
  return MAIN_TAB_PAGE_ORDER.indexOf(page);
}

function pageIndexForPath(path: string): number | null {
  const page = PATH_TO_PAGE[path];
  if (!page) return null;
  return MAIN_TAB_PAGE_ORDER.indexOf(page);
}

export function MainTabNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const pageWidth = useContentWidth();
  const translateX = useSharedValue(0);
  const pageIndexRef = useRef(0);
  const prevPageWidthRef = useRef(pageWidth);
  const [pageIndex, setPageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<PawTabId>('home');

  pageIndexRef.current = pageIndex;

  const applyPageIndex = useCallback(
    (index: number, animate: boolean) => {
      if (pageWidth <= 0) return;
      pageIndexRef.current = index;
      setPageIndex(index);
      const target = -index * pageWidth;
      translateX.value = animate
        ? withTiming(target, { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) })
        : target;
    },
    [pageWidth, translateX],
  );

  const syncFromPath = useCallback(
    (path: string, animate: boolean) => {
      const index = pageIndexForPath(path);
      if (index == null) return;
      setActiveTab(PATH_TO_TAB[path] ?? (MAIN_TAB_PAGE_ORDER[index] as PawTabId));
      applyPageIndex(index, animate);
    },
    [applyPageIndex],
  );

  useEffect(() => {
    syncFromPath(pathname, false);
  }, [pathname, pageWidth, syncFromPath]);

  useEffect(() => {
    if (pageWidth <= 0 || prevPageWidthRef.current === pageWidth) return;
    prevPageWidthRef.current = pageWidth;
    const target = -pageIndexRef.current * pageWidth;
    translateX.value = target;
  }, [pageWidth, translateX]);

  const goToTab = useCallback(
    (tab: PawTabId) => {
      const nextIndex = pageIndexForTab(tab);
      const nextRoute = TAB_TO_ROUTE[tab];

      setActiveTab(tab);
      applyPageIndex(nextIndex, nextIndex !== pageIndexRef.current);

      if (pathname !== nextRoute) {
        router.replace(nextRoute);
      }
    },
    [applyPageIndex, pathname, router],
  );

  const value = useMemo(
    () => ({
      activeTab,
      pageIndex,
      pageWidth,
      translateX,
      goToTab,
    }),
    [activeTab, pageIndex, pageWidth, translateX, goToTab],
  );

  return <MainTabNavContext.Provider value={value}>{children}</MainTabNavContext.Provider>;
}

export function useMainTabNav() {
  const ctx = useContext(MainTabNavContext);
  if (!ctx) {
    throw new Error('useMainTabNav must be used within MainTabNavProvider');
  }
  return ctx;
}
