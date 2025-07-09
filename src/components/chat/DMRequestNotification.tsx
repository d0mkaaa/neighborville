import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Check, X, Clock } from 'lucide-react';
import type { DMRequest } from '../../services/chatService';

interface DMRequestNotificationProps {
  request: DMRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onClose: () => void;
}

const DMRequestNotification: React.FC<DMRequestNotificationProps> = ({
  request,
  onAccept,
  onDecline,
  onClose
}) => {
  const [isResponding, setIsResponding] = useState(false);

  const handleAccept = async () => {
    setIsResponding(true);
    await onAccept(request._id);
    setIsResponding(false);
  };

  const handleDecline = async () => {
    setIsResponding(true);
    await onDecline(request._id);
    setIsResponding(false);
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(request.expiresAt);
    const diff = expires.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageCircle size={18} className="text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                DM Request
              </p>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{request.requester.username}</span> wants to chat with you
            </p>
            
            {request.message && (
              <p className="text-xs text-gray-500 mt-2 italic">
                "{request.message}"
              </p>
            )}
            
            <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>Expires in {getTimeRemaining()}</span>
            </div>
            
            <div className="flex space-x-2 mt-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAccept}
                disabled={isResponding}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:from-green-600 hover:to-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                <Check size={12} />
                <span>Accept</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDecline}
                disabled={isResponding}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:from-red-600 hover:to-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                <X size={12} />
                <span>Decline</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DMRequestNotification; 