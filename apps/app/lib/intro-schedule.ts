export const INTRO_SHOWN_ON_KEY = 'paw_intro_shown_on_v1';

/** Local calendar day, so "first open of the day" follows the device timezone. */
export function introDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Play the intro on a cold start (the process was not in memory) and on the
 * first open of a new local day while the process is still alive.
 */
export function shouldShowStartupIntro(
  coldStart: boolean,
  lastShownDay: string | null,
  today: string,
): boolean {
  if (coldStart) return true;
  return lastShownDay !== today;
}

let introSettledThisProcess = false;

/** True until this process has finished or skipped the intro. */
export function isFreshProcess(): boolean {
  return !introSettledThisProcess;
}

export function markIntroSettledThisProcess(): void {
  introSettledThisProcess = true;
}
