import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { AnimatedToast } from "./AnimatedToast";
import { setToastHandler } from "@/lib/toastController";

interface ToastOptions {
  message: string;
  subMessage?: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<ToastOptions & { visible: boolean }>({
    visible: false,
    message: "",
    subMessage: "",
    type: "info",
    duration: 2000,
  });

  const showToast = useCallback((options: ToastOptions) => {
    setToast({ ...options, visible: true });
  }, []);

  const handleHide = () => setToast((t) => ({ ...t, visible: false }));

  useEffect(() => {
    setToastHandler(showToast);
    return () => setToastHandler(() => {});
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatedToast
        visible={toast.visible}
        message={toast.message}
        subMessage={toast.subMessage}
        type={toast.type}
        duration={toast.duration}
        onHide={handleHide}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};
