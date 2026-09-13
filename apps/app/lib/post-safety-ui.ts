export type PostSafetyOverlay = 'none' | 'menu' | 'report' | 'block';

export type PostSafetyUiState<T> = {
  target: T | null;
  overlay: PostSafetyOverlay;
};

export const INITIAL_POST_SAFETY_UI: PostSafetyUiState<never> = {
  target: null,
  overlay: 'none',
};

export type PostSafetyUiEvent<T> =
  | { type: 'openMenu'; target: T }
  | { type: 'dismissMenu' }
  | { type: 'selectReport' }
  | { type: 'selectBlock' }
  | { type: 'closeReport' }
  | { type: 'closeBlock' }
  | { type: 'completed' };

/**
 * Keeps the target post while Report/Block is open. Closing the action menu
 * before opening those sheets used to drop the post and hide the next screen.
 */
export function reducePostSafetyUi<T>(
  state: PostSafetyUiState<T>,
  event: PostSafetyUiEvent<T>,
): PostSafetyUiState<T> {
  switch (event.type) {
    case 'openMenu':
      return { target: event.target, overlay: 'menu' };
    case 'dismissMenu':
      if (state.overlay !== 'menu') return state;
      return { target: null, overlay: 'none' };
    case 'selectReport':
      if (!state.target) return state;
      return { target: state.target, overlay: 'report' };
    case 'selectBlock':
      if (!state.target) return state;
      return { target: state.target, overlay: 'block' };
    case 'closeReport':
      if (state.overlay !== 'report') return state;
      return { target: null, overlay: 'none' };
    case 'closeBlock':
      if (state.overlay !== 'block') return state;
      return { target: null, overlay: 'none' };
    case 'completed':
      return { target: null, overlay: 'none' };
    default:
      return state;
  }
}

export function isPostSafetyMenuVisible<T>(state: PostSafetyUiState<T>): boolean {
  return state.overlay === 'menu' && state.target != null;
}

export function isPostSafetyReportVisible<T>(state: PostSafetyUiState<T>): boolean {
  return state.overlay === 'report' && state.target != null;
}

export function isPostSafetyBlockVisible<T>(state: PostSafetyUiState<T>): boolean {
  return state.overlay === 'block' && state.target != null;
}
