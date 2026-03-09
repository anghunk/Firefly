import { ref } from 'vue';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const toasts = ref<Toast[]>([]);

function showToast(
  message: string,
  type: ToastType = 'info',
  duration: number = 3000
) {
  const id = Date.now().toString();
  const toast: Toast = { id, type, message, duration };

  toasts.value.push(toast);
  console.log('Toast added:', toast, 'Total toasts:', toasts.value.length);

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

function removeToast(id: string) {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index > -1) {
    console.log('Toast removed:', id);
    toasts.value.splice(index, 1);
  }
}

function success(message: string, duration?: number) {
  return showToast(message, 'success', duration);
}

function info(message: string, duration?: number) {
  return showToast(message, 'info', duration);
}

function warning(message: string, duration?: number) {
  return showToast(message, 'warning', duration);
}

function error(message: string, duration?: number) {
  return showToast(message, 'error', duration);
}

export function useToast() {
  return {
    toasts,
    showToast,
    removeToast,
    success,
    info,
    warning,
    error,
  };
}