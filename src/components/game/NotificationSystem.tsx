import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle, Info, X, Zap, Coins, Factory, Heart, MessageCircle, Shield, Clock } from "lucide-react";
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
    <div className="fixed top-4 right-4 z-60 max-w-sm space-y-3 pointer-events-none">
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
    const message = notification.message.toLowerCase();
    
    if (message.includes('message') || message.includes('chat') || message.includes('conversation') || message.includes('dm')) {
      return <MessageCircle className="text-white" size={20} />;
    }
    if (message.includes('banned') || message.includes('muted') || message.includes('blocked') || message.includes('inappropriate')) {
      return <Shield className="text-white" size={20} />;
    }
    if (message.includes('rate limit') || message.includes('wait') || message.includes('slow down') || message.includes('too fast')) {
      return <Clock className="text-white" size={20} />;
    }

    if (message.includes('coin') || message.includes('income') || message.includes('earn') || message.includes('spend')) {
      return <Coins className="text-white" size={20} />;
    }
    if (message.includes('production') || message.includes('building') || message.includes('construct')) {
      return <Factory className="text-white" size={20} />;
    }
    if (message.includes('satisfaction') || message.includes('neighbor')) {
      return <Heart className="text-white" size={20} />;
    }
    if (message.includes('energy') || message.includes('power')) {
      return <Zap className="text-white" size={20} />;
    }
    
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="text-white" size={20} />;
      case 'error':
        return <XCircle className="text-white" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-white" size={20} />;
      case 'info':
        return <Info className="text-white" size={20} />;
      default:
        return <Info className="text-white" size={20} />;
    }
  };
  
  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600',
          shadow: 'shadow-lg shadow-emerald-500/25',
          border: 'border border-emerald-400/30',
          glow: 'ring-2 ring-emerald-300/20'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600',
          shadow: 'shadow-lg shadow-red-500/25',
          border: 'border border-red-400/30',
          glow: 'ring-2 ring-red-300/20'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600',
          shadow: 'shadow-lg shadow-amber-500/25',
          border: 'border border-amber-400/30',
          glow: 'ring-2 ring-amber-300/20'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600',
          shadow: 'shadow-lg shadow-blue-500/25',
          border: 'border border-blue-400/30',
          glow: 'ring-2 ring-blue-300/20'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
          shadow: 'shadow-lg shadow-gray-500/25',
          border: 'border border-gray-400/30',
          glow: 'ring-2 ring-gray-300/20'
        };
    }
  };
  
  const style = getNotificationStyle();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
      exit={{ opacity: 0, x: 100, scale: 0.8, y: -10 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94],
        scale: { type: "spring", damping: 15, stiffness: 300 }
      }}
      className={`${style.bg} ${style.shadow} ${style.border} ${style.glow} rounded-2xl backdrop-blur-sm overflow-hidden pointer-events-auto max-w-sm group hover:scale-105 transition-transform duration-200`}
    >
      <div className="relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-white rounded-2xl transform rotate-1"></div>
        </div>
        
        <div className="relative flex items-start px-4 py-3">
          <div className="flex-shrink-0 mr-3 mt-0.5">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              {getIcon()}
            </div>
          </div>
          
          <div className="flex-1 mr-3">
            <p className="text-sm text-white font-medium leading-relaxed lowercase">
              {notification.message}
            </p>
            
            <div className="mt-1">
              <span className="inline-block px-2 py-0.5 bg-white/20 text-white/90 text-xs font-medium rounded-full uppercase tracking-wide">
                {notification.type}
              </span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 group-hover:scale-110"
          >
            <X size={14} />
          </button>
        </div>
        
        {notification.autoRemove && (
          <div className="relative">
            <div className="h-1 bg-white/20 backdrop-blur-sm"></div>
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              onAnimationComplete={onClose}
              className="absolute top-0 left-0 h-1 bg-white/60 backdrop-blur-sm"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}