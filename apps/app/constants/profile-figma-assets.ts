/**
 * Profile screen (Figma node 110:401) — local + remote fallbacks.
 */
export const PROFILE_FIGMA = {
  dogAvatar: require('@/assets/profile/dog-avatar.png'),
  humanAvatar: require('@/assets/profile/human-avatar.png'),
  iconBack: require('@/assets/profile/icon-back.png'),
  iconSaveCheck: require('@/assets/profile/icon-save-check.png'),
} as const;

export const PROFILE_FIGMA_REMOTE = {
  dogAvatar: 'https://www.figma.com/api/mcp/asset/35d4930d-f7d6-4ae0-8772-c4114acf3f40',
  humanAvatar: 'https://www.figma.com/api/mcp/asset/2c4c2ab6-3070-4186-a127-8a92c4842aa1',
} as const;
