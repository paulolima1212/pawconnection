import { Image } from 'expo-image';
import type { ComponentType } from 'react';
import { isValidElementType } from 'react-is';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import PawMark from '@/assets/images/paw-connection-logo.svg';
import PawSplash from '@/assets/images/paw-connection-logo-splash.svg';

type SvgLogoProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

type PawLogoProps = {
  variant: 'mark' | 'splash';
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

function unwrapModuleExport(mod: unknown): unknown {
  if (mod != null && typeof mod === 'object' && 'default' in mod) {
    return (mod as { default: unknown }).default;
  }
  return mod;
}

function resolveSvgComponent(mod: unknown): ComponentType<SvgLogoProps> | number | undefined {
  const inner = unwrapModuleExport(mod);
  if (typeof inner === 'number') return inner;
  if (isValidElementType(inner)) return inner as ComponentType<SvgLogoProps>;
  return undefined;
}

/**
 * Local SVG logos. With `react-native-svg-transformer` the import is usually a component
 * (including memo/forwardRef objects). Numeric imports use expo-image as fallback.
 */
export function PawLogo({ variant, width, height, style }: PawLogoProps) {
  const w = variant === 'splash' ? (width ?? 282) : (width ?? 190);
  const h = variant === 'splash' ? (height ?? 178) : (height ?? 120);
  const raw = variant === 'splash' ? PawSplash : PawMark;
  const resolved = resolveSvgComponent(raw);

  if (typeof resolved === 'number') {
    return (
      <Image
        source={resolved}
        style={[{ width: w, height: h }, style as StyleProp<ImageStyle>]}
        contentFit="contain"
      />
    );
  }

  if (resolved) {
    const Cmp = resolved;
    return <Cmp width={w} height={h} style={style} />;
  }

  return <View style={[{ width: w, height: h }, style]} accessibilityLabel="Paw Connection logo" />;
}
