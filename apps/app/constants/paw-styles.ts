/**
 * Cores e tipografia alinhadas ao protótipo Paw Connection (Figma).
 */
export const PawColors = {
  creamBg: '#fffdd2',
  peach: '#f6a374',
  peachBorder: '#f6a274',
  fieldGray: '#f6f6f6',
  /** Figma setup-dog “Favorite meal” input (node 2-64) */
  fieldWhite: '#ffffff',
  /** Figma circular enjoy checkboxes (lavender fill) */
  checkboxLavender: '#d1c4e9',
  whiteCard: '#fffff4',
  black: '#000000',
  textMuted: '#525252',
  textPlaceholder: '#707070',
  /** Figma social search field placeholder */
  searchPlaceholder: '#888888',
  textSoft: '#8e8e8e',
  textLabelGray: '#828282',
  textSecondary: '#626262',
  navLabel: '#62412e',
  navLabelActive: '#332015',
  reactionGreen: '#243b2f',
  reactionLavender: '#e7c9fe',
  badgeBlue: '#458fff',
  toggleInactive: '#99989d',
  toggleTrack: '#fbf9fe',
  toggleBorder: '#e3e2cc',
  chipGray: '#898989',
  /** Figma profile settings title & labels */
  profileBrown: '#332015',
  profileFieldBorder: 'rgba(0,0,0,0.2)',
  profileTipBg: 'rgba(231,201,254,0.3)',
  profileHeaderBorder: 'rgba(0,0,0,0.1)',
  /** Destructive actions (delete, report) */
  destructive: '#B42318',
  destructiveMuted: 'rgba(180, 35, 24, 0.12)',
} as const;

export const PawLayout = {
  screenMaxWidth: 440,
  horizontalPadding: 22,
  borderRadiusField: 8,
  /** White text fields on cream screens (Figma) */
  borderRadiusWhiteField: 10,
  borderRadiusCard: 9,
  borderRadiusPill: 17,
} as const;

/** Width used for layout/pager on phones and tablets (caps at Figma phone frame). */
export function contentWidthFromWindow(windowWidth: number): number {
  if (windowWidth <= 0) return 0;
  return Math.min(windowWidth, PawLayout.screenMaxWidth);
}

/** Escala tipográfica única para todo o app Paw Connection. */
export const PawFontSize = {
  /** Nav inferior, datas, hints */
  caption: 12,
  /** Tabs, botões compactos, chips, métricas */
  small: 14,
  /** Texto padrão: inputs, parágrafos, labels, badges */
  body: 15,
  /** Subtítulos de seção, nomes em cards */
  subtitle: 17,
  /** Títulos de tela e formulários */
  title: 20,
  /** Nome em destaque no perfil (ex.: Nathan, 26) */
  profileName: 24,
} as const;

export const PawLineHeight = {
  caption: 14,
  small: 18,
  body: 21,
  subtitle: 22,
  title: 26,
  profileName: 30,
} as const;
