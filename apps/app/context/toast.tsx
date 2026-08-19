import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { ToastContainer, type ToastItem, type ToastPosition, type ToastType } from '@/components/paw/toast';
import { TOAST_DEFAULT_DURATION_MS } from '@/constants/toast-styles';
import { getApiBaseUrl, isUsingLocalDevApi } from '@/lib/api/config';

export type ShowToastOptions = {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  position?: ToastPosition;
  action?: ToastItem['action'];
  onDismiss?: () => void;
};

type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (options: ShowToastOptions) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((options: ShowToastOptions): string => {
    const id = makeToastId();
    const item: ToastItem = {
      id,
      type: options.type,
      title: options.title,
      message: options.message,
      duration: options.duration ?? TOAST_DEFAULT_DURATION_MS,
      position: options.position ?? 'top',
      action: options.action,
      onDismiss: options.onDismiss,
    };
    setToasts((prev) => [...prev, item]);
    return id;
  }, []);

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'success', title, message, duration }),
    [showToast],
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'error', title, message, duration }),
    [showToast],
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'warning', title, message, duration }),
    [showToast],
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'info', title, message, duration }),
    [showToast],
  );

  const value = useMemo(
    () => ({ toasts, showToast, removeToast, success, error, warning, info }),
    [toasts, showToast, removeToast, success, error, warning, info],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Modal
        visible={toasts.length > 0}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => {
          if (toasts.length > 0) {
            const last = toasts[toasts.length - 1];
            last.onDismiss?.();
            removeToast(last.id);
          }
        }}>
        <View style={styles.modalRoot} pointerEvents="box-none">
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </View>
      </Modal>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
});

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

/** Friendly API error text for toasts. */
export function toastMessageFromError(err: unknown, fallback: string): string {
  if (!(err instanceof Error) || !err.message.trim()) {
    return fallback;
  }

  const msg = err.message;
  const chatUnavailable =
    msg.includes('Cannot POST') ||
    msg.includes('Cannot GET') ||
    /\/conversations/i.test(msg) ||
    /\/messages\/.*\/reactions/i.test(msg);

  if (chatUnavailable) {
    if (__DEV__) {
      const api = getApiBaseUrl();
      if (!isUsingLocalDevApi()) {
        return `Reações e respostas com citação exigem a API atualizada. Use a API local (EXPO_PUBLIC_USE_LAN_API=true no .env, backend na porta 3001) ou publique o backend remoto com as migrations de chat.`;
      }
      return 'Chat indisponível na API local. Confira se o backend está rodando e se as migrations foram aplicadas (npx prisma migrate deploy).';
    }
    return 'O chat ainda não está disponível neste servidor. Atualize o app quando a API for publicada.';
  }

  return msg;
}
