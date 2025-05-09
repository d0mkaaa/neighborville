import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle, Info, X } from "lucide-react";
import type { NotificationType } from "../../types/game";

export interface ExtendedNotification extends NotificationType {
  id: string;
  autoRemove: boolean;
}

type NotificationSystemProps = {
  notifications: ExtendedNotification[];
  removeNotification: (id: string) => void;
};

export default function NotificationSystem({ 
  notifications, 
  removeNotification 
}: NotificationSystemProps) {
  return (
    <div className="fixed top-24 right-6 z-50 w-72 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem 
            key={notification.id} 
            notification={notification} 
            onClose={() => removeNotification(notification.id)} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

type NotificationItemProps = {
  notification: ExtendedNotification;
  onClose: () => void;
};

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  useEffect(() => {
    if (notification.autoRemove) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification.autoRemove, onClose]);
  
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="text-white" size={18} />;
      case 'error':
        return <XCircle className="text-white" size={18} />;
      case 'warning':
        return <AlertTriangle className="text-white" size={18} />;
      case 'info':
        return <Info className="text-white" size={18} />;
      default:
        return null;
    }
  };
  
  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-emerald-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
        return 'bg-sky-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`${getBgColor()} rounded-lg shadow-xl overflow-hidden pointer-events-auto flex flex-col`}
      style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
    >
      <div className="flex items-center px-3 py-2.5">
        <div className="flex-shrink-0 mr-2">
          {getIcon()}
        </div>
        <div className="flex-1 mr-2">
          <p className="text-sm text-white lowercase">{notification.message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      {notification.autoRemove && (
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 5, ease: "linear" }}
          onAnimationComplete={onClose}
          className="h-1 bg-white bg-opacity-30"
        />
      )}
    </motion.div>
  );
}