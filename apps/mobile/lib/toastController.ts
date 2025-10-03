// toastController.ts
type ToastOptions = {
  message: string;
  subMessage?: string;
  type?: "success" | "error" | "info";
  duration?: number;
};

let showToast: ((options: ToastOptions) => void) | null = null;

export const setToastHandler = (handler: (options: ToastOptions) => void) => {
  showToast = handler;
};

export const triggerToast = (options: ToastOptions) => {
  if (showToast) showToast(options);
};
