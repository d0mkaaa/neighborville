import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Bell } from 'lucide-react';

interface ChatToggleButtonProps {
  onClick: () => void;
  unreadMessages?: number;
  pendingRequests?: number;
}

const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({
  onClick,
  unreadMessages = 0,
  pendingRequests = 0
}) => {
  const totalNotifications = unreadMessages + pendingRequests;
  const hasNotifications = totalNotifications > 0;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white/20"
      title="Open Chat"
      style={{
        background: hasNotifications 
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
          : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #4f46e5 100%)',
        boxShadow: hasNotifications 
          ? '0 10px 25px -5px rgba(239, 68, 68, 0.4), 0 10px 10px -5px rgba(239, 68, 68, 0.2)'
          : '0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.2)',
      }}
    >
      <div className="relative">
        <div className="flex items-center justify-center">
          {hasNotifications ? (
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Bell size={24} />
            </motion.div>
          ) : (
            <MessageCircle size={24} />
          )}
        </div>
        
        {totalNotifications > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-yellow-400 text-red-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-md"
          >
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </motion.div>
        )}
        
        {hasNotifications && (
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-red-500/30"
          />
        )}
      </div>
    </motion.button>
  );
};

export default ChatToggleButton; 