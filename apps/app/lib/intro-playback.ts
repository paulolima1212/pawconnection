/** Composition length of paw-connection-intro.lottie.json (210 frames at 30 fps). */
export const INTRO_DURATION_MS = 7_000;

/** Enters the app if the animation never loads or never reports completion. */
export const INTRO_FAILSAFE_MS = 15_000;

/**
 * Ignore a completion event that fires before the composition has actually
 * played, including a cancelled event from unmount.
 */
export function shouldCompleteIntro(elapsedMs: number, cancelled: boolean): boolean {
  if (cancelled) return false;
  return elapsedMs >= INTRO_DURATION_MS - 200;
}
