/** Paleta do sistema de toast (docs/toast-system.md). */
export const ToastPalette = {
  success: {
    background: '#58816d',
    border: '#243b2f',
    foreground: '#ffffff',
  },
  error: {
    background: '#e57373',
    border: '#d32f2f',
    foreground: '#ffffff',
  },
  warning: {
    background: '#f6a274',
    border: '#e08a5a',
    foreground: '#332015',
  },
  info: {
    background: '#e7c9fe',
    border: '#c49ee8',
    foreground: '#332015',
  },
  frame: '#000000',
} as const;

export const TOAST_DEFAULT_DURATION_MS = 3000;
