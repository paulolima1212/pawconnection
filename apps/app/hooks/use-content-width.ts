import { useWindowDimensions } from 'react-native';

import { contentWidthFromWindow } from '@/constants/paw-styles';

/** Effective content width — full window on phones, capped on tablets/large screens. */
export function useContentWidth(): number {
  const { width } = useWindowDimensions();
  return contentWidthFromWindow(width);
}
