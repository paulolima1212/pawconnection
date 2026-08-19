import type { ImageSourcePropType } from 'react-native';

/**
 * Onboarding illustrations — local Figma exports (not ephemeral MCP URLs).
 */
export const FIGMA_SETUP_DOG = {
  dogIllustration: require('@/assets/onboarding/dog-illustration.png') as ImageSourcePropType,
  back: require('@/assets/profile/icon-back.png') as ImageSourcePropType,
} as const;

export const FIGMA_SETUP_YOU = {
  ownerIllustration: require('@/assets/onboarding/owner-illustration.png') as ImageSourcePropType,
  back: require('@/assets/profile/icon-back.png') as ImageSourcePropType,
} as const;
