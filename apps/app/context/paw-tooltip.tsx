import { type ReactNode, useCallback, useMemo } from 'react';

import type { ToastPosition, ToastType } from '@/components/paw/toast';
import {
  ToastProvider,
  toastMessageFromError,
  useToast,
  type ShowToastOptions,
} from '@/context/toast';

export type PawTooltipVariant = ToastType;

export type PawTooltipOptions = {
  message: string;
  title?: string;
  variant?: PawTooltipVariant;
  durationMs?: number;
  position?: ToastPosition;
  onDismiss?: () => void;
  action?: ShowToastOptions['action'];
};

type PawTooltipContextValue = {
  showTooltip: (options: PawTooltipOptions) => string;
  hideTooltip: () => void;
};

function mapTooltipToToast(options: PawTooltipOptions): ShowToastOptions {
  const variant = options.variant ?? 'error';
  const defaultTitle =
    variant === 'success'
      ? 'Saved!'
      : variant === 'error'
        ? 'Something went wrong'
        : variant === 'warning'
          ? 'Attention'
          : 'Heads up';

  return {
    type: variant,
    title: options.title ?? defaultTitle,
    message: options.message,
    duration: options.durationMs,
    position: options.position,
    action: options.action,
    onDismiss: options.onDismiss,
  };
}

export function PawTooltipProvider({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

export function usePawTooltip(): PawTooltipContextValue {
  const { showToast, removeToast, toasts } = useToast();

  const showTooltip = useCallback(
    (options: PawTooltipOptions) => showToast(mapTooltipToToast(options)),
    [showToast],
  );

  const hideTooltip = useCallback(() => {
    const last = toasts[toasts.length - 1];
    if (last) {
      last.onDismiss?.();
      removeToast(last.id);
    }
  }, [toasts, removeToast]);

  return useMemo(
    () => ({ showTooltip, hideTooltip }),
    [showTooltip, hideTooltip],
  );
}

export function usePawTopToast() {
  const { showTooltip, hideTooltip } = usePawTooltip();
  return { showToast: showTooltip, hideTooltip, ToastPortal: null };
}

export { toastMessageFromError, toastMessageFromError as tooltipMessageFromError };
