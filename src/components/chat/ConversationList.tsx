import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, MessageCircle, Search, Clock } from 'lucide-react';
import { type Conversation, chatUtils } from '../../services/chatService';

interface ConversationListProps {
  conversations: Conversation[];
  searchQuery: string;
  onSelectConversation: (conversationId: string) => void;
  onArchiveConversation: (conversationId: string) => void;
  onStartNewConversation: (username: string) => void;
  onGlobalChatClick: () => void;
  currentUserId: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  searchQuery,
  onSelectConversation,
  onArchiveConversation,
  onStartNewConversation,
  onGlobalChatClick,
  currentUserId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter((conversation) => {
    const query = searchTerm || searchQuery;
    if (!query) return true;
    
    const otherUser = chatUtils.getOtherParticipant(conversation, currentUserId);
    return otherUser?.username.toLowerCase().includes(query.toLowerCase());
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50/95 to-white/95 backdrop-blur-sm">
      <div className="p-4 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Messages</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStartNewConversation('')}
            className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm"
          >
            <Plus size={14} />
          </motion.button>
        </div>
        
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white/80 border border-gray-200/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <MessageCircle size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1">No conversations yet</p>
            <p className="text-xs text-gray-400">Start a new conversation to get chatting!</p>
          </div>
        ) : (
          <div className="py-2">
            {filteredConversations.map((conversation, index) => {
              const otherUser = chatUtils.getOtherParticipant(conversation, currentUserId);
              const hasUnread = conversation.unreadCount > 0;
              
              return (
                <motion.div
                  key={conversation._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectConversation(conversation._id)}
                  className="mx-2 mb-1 p-3 bg-white/60 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-white/80 hover:shadow-sm transition-all duration-200 border border-gray-100/50 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm">
                        {otherUser?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {otherUser?.username || 'Unknown User'}
                        </h4>
                        {conversation.updatedAt && (
                          <div className="flex items-center text-xs text-gray-400 ml-2">
                            <Clock size={10} className="mr-1" />
                            {formatTime(conversation.updatedAt)}
                          </div>
                        )}
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className={`text-xs truncate ${hasUnread ? 'text-gray-600 font-medium' : 'text-gray-500'}`}>
                          {conversation.lastMessage.sender?._id === currentUserId ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-0 group-hover:w-1 h-0 group-hover:h-8 bg-blue-500 rounded-full transition-all duration-200 absolute right-0 top-1/2 transform -translate-y-1/2" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList; 