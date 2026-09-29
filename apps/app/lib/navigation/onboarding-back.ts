export const ONBOARDING_ROUTE_NAMES = new Set([
  'interests',
  'setup-dog',
  'setup-you',
  'easy-qr',
]);

const ONBOARDING_PATHS = new Set(['/interests', '/setup-dog', '/setup-you', '/easy-qr']);

export function isOnboardingPath(pathname: string): boolean {
  return ONBOARDING_PATHS.has(pathname);
}

/**
 * Only a signed-in user who already finished signup should be pulled out of
 * the registration screens. A logged-out device must be able to start a new account.
 */
export function shouldRedirectCompletedUserFromSignup(
  isAuthenticated: boolean,
  onboardingComplete: boolean,
  pathname: string,
): boolean {
  return isAuthenticated && onboardingComplete && isOnboardingPath(pathname);
}

type NavigationState = {
  index?: number;
  routes?: { name?: string }[];
};

export function shouldResetOnboardingBack(
  onboardingComplete: boolean,
  state: NavigationState | undefined,
): boolean {
  if (!onboardingComplete || !state) return false;
  const index = state.index ?? 0;
  if (index <= 0) return false;
  const previous = state.routes?.[index - 1]?.name;
  return previous != null && ONBOARDING_ROUTE_NAMES.has(previous);
}
