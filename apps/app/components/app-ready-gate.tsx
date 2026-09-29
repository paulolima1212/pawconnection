import type { ReactNode } from 'react';

/** The intro hides the native splash once its first frame is ready. */
export function AppReadyGate({ children }: { children: ReactNode }) {
  return children;
}
