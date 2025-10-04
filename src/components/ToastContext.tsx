import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  hideToast: () => void;
}

export const useToast = (): ToastContextType => {
  const showToast = (message: string, type: ToastType = 'info', duration: number = 4000) => {
    Toast.show({
      type: type,
      text1: message,
      visibilityTime: duration,
      position: 'bottom',
    });
  };

  const showSuccess = (message: string, duration: number = 2000) => {
    showToast(message, 'success', duration);
  };

  const showError = (message: string, duration: number = 4000) => {
    showToast(message, 'error', duration);
  };

  const showInfo = (message: string, duration: number = 4000) => {
    showToast(message, 'info', duration);
  };

  const showWarning = (message: string, duration: number = 4000) => {
    showToast(message, 'warning', duration);
  };

  const hideToast = () => {
    Toast.hide();
  };

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    hideToast,
  };
};