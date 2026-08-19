/**
 * @deprecated Use `Toast` from `@/components/paw/toast` and `useToast()` from `@/hooks/use-toast`.
 */
export {
  Toast as PawTopToast,
  ToastContainer,
  type ToastItem,
  type ToastProps,
  type ToastType as PawTopToastVariant,
  type ToastPosition,
} from '@/components/paw/toast';

export type PawTopToastOptions = {
  message: string;
  title?: string;
  variant?: import('@/components/paw/toast').ToastType;
  durationMs?: number;
  onDismiss?: () => void;
  action?: import('@/components/paw/toast').ToastItem['action'];
};
