import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

interface ToastItem {
  message: string;
  type: string;
}

let toastId = 0;
const toasts: Record<number, ToastItem> = {};
let setToastsCallback: ((toasts: Record<number, ToastItem>) => void) | null = null;

const ToastComponent: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const icon = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    warning: <AlertCircle className="text-yellow-500" size={20} />,
    info: <AlertCircle className="text-blue-500" size={20} />
  }[type];

  const bgColor = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50'
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`flex items-center p-4 mb-4 rounded-lg shadow-lg ${bgColor}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-3 mr-4 text-sm font-medium">{message}</div>
      <button
        onClick={onClose}
        className="ml-auto flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500"
      >
        <X size={20} />
      </button>
    </motion.div>
  );
};

const ToastContainer: React.FC = () => {
  const [toastState, setToastState] = React.useState<Record<number, ToastItem>>({});
  
  React.useEffect(() => {
    setToastsCallback = (newToasts) => setToastState({ ...newToasts });
    return () => {
      setToastsCallback = null;
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence>
        {Object.entries(toastState).map(([id, toast]) => (
          <ToastComponent
            key={id}
            message={toast.message}
            type={toast.type as 'success' | 'error' | 'warning' | 'info'}
            onClose={() => {
              delete toasts[Number(id)];
              setToastState({ ...toasts });
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Toast = {
  success: (message: string) => {
    const id = toastId++;
    toasts[id] = { message, type: 'success' };
    setToastsCallback?.(toasts);
    setTimeout(() => {
      delete toasts[id];
      setToastsCallback?.(toasts);
    }, 5000);
  },

  error: (message: string) => {
    const id = toastId++;
    toasts[id] = { message, type: 'error' };
    setToastsCallback?.(toasts);
    setTimeout(() => {
      delete toasts[id];
      setToastsCallback?.(toasts);
    }, 5000);
  },

  warning: (message: string) => {
    const id = toastId++;
    toasts[id] = { message, type: 'warning' };
    setToastsCallback?.(toasts);
    setTimeout(() => {
      delete toasts[id];
      setToastsCallback?.(toasts);
    }, 5000);
  },

  info: (message: string) => {
    const id = toastId++;
    toasts[id] = { message, type: 'info' };
    setToastsCallback?.(toasts);
    setTimeout(() => {
      delete toasts[id];
      setToastsCallback?.(toasts);
    }, 5000);
  },

  Container: ToastContainer
};

export default ToastComponent;
export { Toast, ToastContainer }; 