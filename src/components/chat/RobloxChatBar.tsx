import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Search, Settings, X, Plus, Bell, User, Users } from 'lucide-react';
import StartDMModal from './StartDMModal';
import DMRequestNotification from './DMRequestNotification';
import { chatService } from '../../services/chatService';
import type { DMRequest } from '../../services/chatService';
import socketService from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';

interface RobloxChatBarProps {
  onOpenChat: () => void;
  onClose: () => void;
  unreadMessages?: number;
}

const RobloxChatBar: React.FC<RobloxChatBarProps> = ({
  onOpenChat,
  onClose,
  unreadMessages = 0
}) => {
  const { user } = useAuth();
  const [showStartDMModal, setShowStartDMModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<DMRequest[]>([]);
  const [currentNotification, setCurrentNotification] = useState<DMRequest | null>(null);

  useEffect(() => {
    const handleDMRequestReceived = (request: DMRequest) => {
      console.log('🔔 New DM request received:', request);
      
      setPendingRequests(prev => {
        const exists = prev.some(req => req._id === request._id);
        if (exists) return prev;
        
        const newRequests = [...prev, request];
        
        if (!currentNotification) {
          setCurrentNotification(request);
        }
        
        return newRequests;
      });
    };

    const handleDMRequestAccepted = (data: { requestId: string; conversation: any }) => {
      console.log('✅ DM request accepted:', data);
      
      setPendingRequests(prev => prev.filter(req => req._id !== data.requestId));
      
      if (currentNotification?._id === data.requestId) {
        setCurrentNotification(null);
        const remaining = pendingRequests.filter(req => req._id !== data.requestId);
        if (remaining.length > 0) {
          setCurrentNotification(remaining[0]);
        }
      }
    };

    const handleDMRequestDeclined = (data: { requestId: string }) => {
      console.log('❌ DM request declined:', data);
      
      setPendingRequests(prev => prev.filter(req => req._id !== data.requestId));
      
      if (currentNotification?._id === data.requestId) {
        setCurrentNotification(null);
        const remaining = pendingRequests.filter(req => req._id !== data.requestId);
        if (remaining.length > 0) {
          setCurrentNotification(remaining[0]);
        }
      }
    };

    socketService.on('dm_request:received', handleDMRequestReceived);
    socketService.on('dm_request:accepted', handleDMRequestAccepted);
    socketService.on('dm_request:declined', handleDMRequestDeclined);

    return () => {
      socketService.off('dm_request:received', handleDMRequestReceived);
      socketService.off('dm_request:accepted', handleDMRequestAccepted);
      socketService.off('dm_request:declined', handleDMRequestDeclined);
    };
  }, [currentNotification, pendingRequests]);

  useEffect(() => {
    if (user) {
      loadPendingRequests();
    }
  }, [user]);

  const loadPendingRequests = async () => {
    try {
      const response = await chatService.getDMRequests('received');
      console.log('DM requests response:', response);
      
      const requests = response.requests || [];
      const pending = requests.filter((req: DMRequest) => req.status === 'pending');
      setPendingRequests(pending);
      
      if (pending.length > 0 && !currentNotification) {
        setCurrentNotification(pending[0]);
      }
    } catch (error) {
      console.error('Error loading pending DM requests:', error);
      setPendingRequests([]);
    }
  };

  const handleDMRequestSent = (username: string) => {
    console.log(`DM request sent to ${username}!`);
  };

  const handleConversationStarted = (conversation: any) => {
    console.log('Conversation started:', conversation);
    onOpenChat();
  };

  const handleAcceptDMRequest = async (requestId: string) => {
    try {
      const response = await chatService.respondToDMRequest(requestId, 'accept');
      console.log('DM request accepted:', response);
      
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      
      if (currentNotification?._id === requestId) {
        setCurrentNotification(null);
        const remaining = pendingRequests.filter(req => req._id !== requestId);
        if (remaining.length > 0) {
          setCurrentNotification(remaining[0]);
        }
      }
      
      if (response.conversation) {
        onOpenChat();
      }
    } catch (error) {
      console.error('Error accepting DM request:', error);
    }
  };

  const handleDeclineDMRequest = async (requestId: string) => {
    try {
      await chatService.respondToDMRequest(requestId, 'decline');
      console.log('DM request declined');
      
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      
      if (currentNotification?._id === requestId) {
        setCurrentNotification(null);
        const remaining = pendingRequests.filter(req => req._id !== requestId);
        if (remaining.length > 0) {
          setCurrentNotification(remaining[0]);
        }
      }
    } catch (error) {
      console.error('Error declining DM request:', error);
    }
  };

  const handleNotificationClose = () => {
    setCurrentNotification(null);
    const remaining = pendingRequests.filter(req => req._id !== currentNotification?._id);
    if (remaining.length > 0) {
      setCurrentNotification(remaining[0]);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-4 py-2 border-b border-gray-700/50 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle size={16} className="text-blue-400" />
              <span className="text-white font-medium text-sm">Chat</span>
              {unreadMessages > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                >
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </motion.div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {pendingRequests.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative text-gray-400 hover:text-gray-200 transition-colors"
                  title={`${pendingRequests.length} pending DM request${pendingRequests.length > 1 ? 's' : ''}`}
                >
                  <Bell size={14} />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center"
                    style={{ fontSize: '8px' }}
                  >
                    {pendingRequests.length}
                  </motion.div>
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <Settings size={14} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                title="Close Chat"
              >
                <X size={14} />
              </motion.button>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.7)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenChat}
          className="w-full px-4 py-3 text-left transition-all duration-200 group"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search size={16} className="text-gray-400 group-hover:text-gray-300" />
            </div>
            <span className="text-gray-400 group-hover:text-gray-300 text-sm">
              Search for friends
            </span>
          </div>
        </motion.button>

        <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <div className="px-4 py-6 text-center">
            <p className="text-gray-400 text-sm">No recent conversations</p>
            <p className="text-gray-500 text-xs mt-1">Start a new chat to get started!</p>
          </div>
        </div>

        <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700/50 space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowStartDMModal(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            <Plus size={12} />
            <span>Start New Chat</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenChat}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center space-x-2 transition-all"
          >
            <Users size={12} />
            <span>Join Global Chat</span>
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {currentNotification && (
          <DMRequestNotification
            key={currentNotification._id}
            request={currentNotification}
            onAccept={handleAcceptDMRequest}
            onDecline={handleDeclineDMRequest}
            onClose={handleNotificationClose}
          />
        )}
      </AnimatePresence>

      <StartDMModal
        isOpen={showStartDMModal}
        onClose={() => setShowStartDMModal(false)}
        onDMRequestSent={handleDMRequestSent}
        onConversationStarted={handleConversationStarted}
      />
    </motion.div>
  );
};

export default RobloxChatBar; 