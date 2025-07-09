import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  Edit3,
  Trash2,
  Reply,
  Copy,
  Star,
  Flag,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Shield,
  Ban,
  Timer,
  UserX,
  Crown,
  Volume2,
  VolumeX,
  MessageCircle,
} from 'lucide-react';
import { type Message, chatUtils } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onModerateUser?: (userId: string, action: 'timeout' | 'ban' | 'kick' | 'mute', duration?: number) => void;
  onReportMessage?: (messageId: string, reason: string) => void;
  isGlobalChat?: boolean;
  onlineUsers?: Set<string>;
}

interface MessageActionProps {
  message: Message;
  isCurrentUser: boolean;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReply: () => void;
  onCopy: () => void;
  onModerateUser?: (userId: string, action: 'timeout' | 'ban' | 'kick' | 'mute', duration?: number) => void;
  onReport: (reason: string) => void;
  isGlobalChat?: boolean;
}

const MessageActions: React.FC<MessageActionProps> = ({
  message,
  isCurrentUser,
  isAdmin,
  onEdit,
  onDelete,
  onReply,
  onCopy,
  onModerateUser,
  onReport,
  isGlobalChat = false,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showModerationMenu, setShowModerationMenu] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActions(false);
        setShowModerationMenu(false);
        setShowReportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModerateUser = (action: 'timeout' | 'ban' | 'kick' | 'mute', duration?: number) => {
    if (onModerateUser) {
      onModerateUser(message.sender._id, action, duration);
    }
    setShowActions(false);
    setShowModerationMenu(false);
  };

  const handleReport = (reason: string) => {
    onReport(reason);
    setShowActions(false);
    setShowReportMenu(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowActions(!showActions)}
        className="p-1 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        <MoreVertical size={16} className="text-gray-500" />
      </motion.button>

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[60] min-w-[140px] max-h-[300px] overflow-y-auto"
            style={{ 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
            }}
          >
            <button
              onClick={() => {
                onReply();
                setShowActions(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Reply size={16} className="text-gray-500" />
              <span className="text-sm">Reply</span>
            </button>

            <button
              onClick={() => {
                onCopy();
                setShowActions(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Copy size={16} className="text-gray-500" />
              <span className="text-sm">Copy</span>
            </button>

            {isCurrentUser && (
              <>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => {
                    onEdit();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <Edit3 size={16} className="text-gray-500" />
                  <span className="text-sm">Edit</span>
                </button>

                <button
                  onClick={() => {
                    onDelete();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 transition-colors flex items-center space-x-2 text-red-600"
                >
                  <Trash2 size={16} className="text-red-500" />
                  <span className="text-sm">Delete</span>
                </button>
              </>
            )}

            {isAdmin && !isCurrentUser && isGlobalChat && (
              <>
                <hr className="my-1 border-gray-100" />
                <div className="px-3 py-1">
                  <span className="text-xs font-medium text-gray-700 flex items-center space-x-1">
                    <Shield size={12} className="text-blue-500" />
                    <span>Moderation</span>
                  </span>
                </div>

                <button
                  onClick={() => setShowModerationMenu(!showModerationMenu)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center space-x-2 text-blue-600"
                >
                  <UserX size={16} className="text-blue-500" />
                  <span className="text-sm">Moderate User</span>
                </button>

                {showModerationMenu && (
                  <div className="ml-4 border-l-2 border-blue-100 pl-2 space-y-1">
                    <button
                      onClick={() => handleModerateUser('timeout', 300)}
                      className="w-full text-left px-2 py-1 hover:bg-yellow-50 transition-colors flex items-center space-x-2 text-yellow-600"
                    >
                      <Timer size={14} className="text-yellow-500" />
                      <span className="text-xs">Timeout 5m</span>
                    </button>

                    <button
                      onClick={() => handleModerateUser('timeout', 1800)}
                      className="w-full text-left px-2 py-1 hover:bg-yellow-50 transition-colors flex items-center space-x-2 text-yellow-600"
                    >
                      <Timer size={14} className="text-yellow-500" />
                      <span className="text-xs">Timeout 30m</span>
                    </button>

                    <button
                      onClick={() => handleModerateUser('mute', 600)}
                      className="w-full text-left px-2 py-1 hover:bg-orange-50 transition-colors flex items-center space-x-2 text-orange-600"
                    >
                      <VolumeX size={14} className="text-orange-500" />
                      <span className="text-xs">Mute 10m</span>
                    </button>

                    <button
                      onClick={() => handleModerateUser('kick')}
                      className="w-full text-left px-2 py-1 hover:bg-red-50 transition-colors flex items-center space-x-2 text-red-600"
                    >
                      <UserX size={14} className="text-red-500" />
                      <span className="text-xs">Kick</span>
                    </button>

                    <button
                      onClick={() => handleModerateUser('ban')}
                      className="w-full text-left px-2 py-1 hover:bg-red-50 transition-colors flex items-center space-x-2 text-red-600"
                    >
                      <Ban size={14} className="text-red-500" />
                      <span className="text-xs">Ban</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    onDelete();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 transition-colors flex items-center space-x-2 text-red-600"
                >
                  <Trash2 size={16} className="text-red-500" />
                  <span className="text-sm">Delete Message</span>
                </button>
              </>
            )}

            {!isCurrentUser && !isAdmin && (
              <>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => setShowReportMenu(!showReportMenu)}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 transition-colors flex items-center space-x-2 text-red-600"
                >
                  <Flag size={16} className="text-red-500" />
                  <span className="text-sm">Report</span>
                </button>

                {showReportMenu && (
                  <div className="ml-4 border-l-2 border-red-100 pl-2 space-y-1">
                    <button
                      onClick={() => handleReport('spam')}
                      className="w-full text-left px-2 py-1 hover:bg-red-50 transition-colors text-xs text-red-600"
                    >
                      Spam
                    </button>
                    <button
                      onClick={() => handleReport('harassment')}
                      className="w-full text-left px-2 py-1 hover:bg-red-50 transition-colors text-xs text-red-600"
                    >
                      Harassment
                    </button>
                    <button
                      onClick={() => handleReport('inappropriate')}
                      className="w-full text-left px-2 py-1 hover:bg-red-50 transition-colors text-xs text-red-600"
                    >
                      Inappropriate
                    </button>
                    <button
                      onClick={() => handleReport('other')}
                      className="w-full text-left px-2 py-1 hover:bg-red-50 transition-colors text-xs text-red-600"
                    >
                      Other
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MessageBubble: React.FC<{
  message: Message;
  isCurrentUser: boolean;
  showTimestamp: boolean;
  isGrouped: boolean;
  isAdmin: boolean;
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onModerateUser?: (userId: string, action: 'timeout' | 'ban' | 'kick' | 'mute', duration?: number) => void;
  onReportMessage?: (messageId: string, reason: string) => void;
  isGlobalChat?: boolean;
  onlineUsers?: Set<string>;
}> = ({
  message,
  isCurrentUser,
  showTimestamp,
  isGrouped,
  isAdmin,
  onEditMessage,
  onDeleteMessage,
  onReply,
  onModerateUser,
  onReportMessage,
  isGlobalChat = false,
  onlineUsers,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEditMessage(message._id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleReport = (reason: string) => {
    if (onReportMessage) {
      onReportMessage(message._id, reason);
    }
  };

  const getStatusIcon = () => {
    if (!isCurrentUser) return null;
    
    switch (message.status) {
      case 'sent':
        return <Clock size={12} className="text-gray-400" />;
      case 'delivered':
        return <Check size={12} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={12} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const getUserBadge = () => {
    if (message.sender.username === 'd0mkaaa' || message.sender.username.toLowerCase().includes('admin')) {
      return (
        <Crown size={12} className="text-yellow-500 ml-1" />
      );
    }
    return null;
  };

  return (
    <div
      data-message-id={message._id}
      className={`group flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
        isGrouped ? 'mb-1' : 'mb-3'
      }`}
    >
      <div className={`flex max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isCurrentUser && !isGrouped && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold mr-3 mt-1 shadow-lg">
            {message.sender.username[0].toUpperCase()}
          </div>
        )}

        <div className={`${!isCurrentUser && isGrouped ? 'ml-11' : ''}`}>
          {!isCurrentUser && !isGrouped && (
            <div className="flex items-center mb-1">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <div className="flex items-center">
                  <span 
                    className="truncate max-w-[120px] cursor-pointer" 
                    title={message.sender.username}
                  >
                    {message.sender.username}
                  </span>
                  {getUserBadge()}
                </div>
              </span>
              {message.sender.gameData?.level && (
                <span className="text-xs text-gray-500 ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
                  Lvl {message.sender.gameData.level}
                </span>
              )}
            </div>
          )}

          <div className="flex items-end space-x-2">
            <div
              className={`relative px-4 py-2.5 rounded-2xl shadow-sm backdrop-blur-sm transition-all hover:shadow-md ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-white/90 border border-gray-200/60'
              } ${
                !isCurrentUser && isGrouped ? 'rounded-tl-md' : 
                !isCurrentUser ? 'rounded-tl-2xl' : ''
              } ${
                isCurrentUser && isGrouped ? 'rounded-tr-md' : 
                isCurrentUser ? 'rounded-tr-2xl' : ''
              }`}
            >   
              {message.replyTo && (
                <div 
                  className={`mb-2 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${
                    isCurrentUser ? 'bg-white/20' : 'bg-gray-50'
                  }`}
                  onClick={() => {
                    const replyElement = document.querySelector(`[data-message-id="${message.replyTo?._id}"]`);
                    if (replyElement) {
                      replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      replyElement.classList.add('animate-pulse');
                      setTimeout(() => replyElement.classList.remove('animate-pulse'), 1000);
                    }
                  }}
                  title="Click to jump to original message"
                >
                  <div className="text-xs opacity-75 mb-1 flex items-center">
                    <Reply size={10} className="mr-1" />
                    Replying to {message.replyTo.sender.username}
                  </div>
                  <div className="text-xs opacity-90 line-clamp-2">
                    {message.replyTo.content}
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className="min-w-[200px]">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="w-full bg-transparent border-none outline-none text-sm"
                    autoFocus
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={handleSaveEdit}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                  {message.metadata?.edited && (
                    <span className="text-xs opacity-75 ml-2">(edited)</span>
                  )}
                </div>
              )}
            </div>

            <MessageActions
              message={message}
              isCurrentUser={isCurrentUser}
              isAdmin={isAdmin}
              onEdit={() => setIsEditing(true)}
              onDelete={() => onDeleteMessage(message._id)}
              onReply={() => onReply(message._id)}
              onCopy={handleCopy}
              onModerateUser={onModerateUser}
              onReport={handleReport}
              isGlobalChat={isGlobalChat}
            />
          </div>

          {(showTimestamp || isCurrentUser) && (
            <div className={`flex items-center mt-1 space-x-2 ${
              isCurrentUser ? 'justify-end' : 'justify-start'
            }`}>
              {showTimestamp && (
                <span className="text-xs text-gray-500">
                  {chatUtils.formatTimeOnly(message.createdAt)}
                </span>
              )}
              {getStatusIcon()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
  onReply,
  onModerateUser,
  onReportMessage,
  isGlobalChat = false,
  onlineUsers,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      setIsAtBottom(true);
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setIsAtBottom(isBottom);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <MessageCircle size={32} className="text-white" />
          </div>
          <p className="text-gray-500 text-lg font-medium">No messages yet</p>
          <p className="text-gray-400 text-sm mt-2">
            {isGlobalChat ? 'Be the first to say hello!' : 'Start a conversation!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4"
      style={{ 
        scrollBehavior: 'auto',
        maxHeight: '100%'
      }}
    >
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : undefined;
        const isCurrentUser = chatUtils.isMessageFromCurrentUser(message, currentUserId);
        const showTimestamp = chatUtils.shouldShowTimestamp(message, prevMessage);
        const isGrouped = chatUtils.shouldGroupMessage(message, prevMessage);

        return (
          <MessageBubble
            key={message._id}
            message={message}
            isCurrentUser={isCurrentUser}
            showTimestamp={showTimestamp}
            isGrouped={isGrouped}
            isAdmin={isAdmin}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onReply={onReply}
            onModerateUser={onModerateUser}
            onReportMessage={onReportMessage}
            isGlobalChat={isGlobalChat}
            onlineUsers={onlineUsers}
          />
        );
      })}
      
      <div ref={messagesEndRef} />
      
      {!isAtBottom && messages.length > 0 && (
        <button
          onClick={() => {
            setIsAtBottom(true);
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
          }}
          className="fixed bottom-20 right-8 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors z-10"
        >
          ↓
        </button>
      )}
    </div>
  );
};

export default MessageList; 