import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MessageCircle, Send, User, Users } from 'lucide-react';
import { chatService } from '../../services/chatService';

interface StartDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationStarted: (conversation: any) => void;
}

interface SearchUser {
  _id: string;
  username: string;
  gameData?: {
    level: number;
  };
}

const StartDMModal: React.FC<StartDMModalProps> = ({
  isOpen,
  onClose,
  onConversationStarted
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await chatService.searchUsers(searchQuery.trim());
        console.log('User search response:', response);
        
        const users = response.users || [];
        setSearchResults(users);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleUserSelect = (user: SearchUser) => {
    setSelectedUser(user);
    setSearchQuery(user.username);
    setSearchResults([]);
  };

  const handleSendRequest = async () => {
    if (!selectedUser) return;

    setIsCreating(true);
    try {
      const response = await chatService.createConversation({ recipientUsername: selectedUser.username });
      
      if (response.conversation) {
        onConversationStarted(response.conversation);
        console.log('Conversation started!');
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      alert(error.response?.data?.message || 'Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle size={20} />
                <h2 className="text-lg font-semibold">Start New Chat</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Search Results:</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {searchResults.map((user) => (
                    <motion.button
                      key={user._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUserSelect(user)}
                      className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User size={14} className="text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">
                          Level {user.gameData?.level || 1}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {isSearching && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center space-x-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-sm">Searching...</span>
                </div>
              </div>
            )}

            {selectedUser && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Sending request to:</p>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedUser.username}</p>
                    <p className="text-xs text-gray-500">
                      Level {selectedUser.gameData?.level || 1}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendRequest}
                disabled={!selectedUser || isCreating}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Start Conversation</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StartDMModal; 