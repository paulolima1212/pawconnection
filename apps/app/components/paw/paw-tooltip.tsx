/** UI + hooks — prefer `useToast()` / `usePawTooltip()` from `@/hooks/use-toast` or `@/context/paw-tooltip`. */
export {
  Toast,
  ToastContainer,
  type ToastItem,
  type ToastProps,
  type ToastType,
  type ToastPosition,
} from '@/components/paw/toast';
export { ToastProvider, useToast, type ShowToastOptions } from '@/context/toast';
export {
  usePawTooltip,
  usePawTopToast,
  PawTooltipProvider,
  toastMessageFromError,
  tooltipMessageFromError,
  type PawTooltipOptions,
  type PawTooltipVariant,
} from '@/context/paw-tooltip';
