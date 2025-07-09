import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  User,
  Settings,
  Archive,
  Trash2,
  Edit3,
  Reply,
  Users,
  Globe,
  Crown,
  Volume2,
  VolumeX,
  Search,
  Hash,
  Minimize2,
  Maximize2,
  Phone,
  Video,
  Info,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  MessageCircle,
  Bell,
  Shield,
} from 'lucide-react';
import { chatService, chatUtils } from '../../services/chatService';
import type { Message, Conversation, ChatRoom } from '../../services/chatService';
import socketService from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ConversationList from './ConversationList';
import GlassCard from '../ui/GlassCard';

interface ChatWindowProps {
  onClose: () => void;
  initialView?: 'conversations' | 'global' | 'conversation';
  initialConversationId?: string;
}

type ChatView = 'conversations' | 'global' | 'conversation' | 'settings';

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  onClose, 
  initialView = 'conversations',
  initialConversationId 
}) => {
  const { user } = useAuth();
  
  const [currentView, setCurrentView] = useState<ChatView>(initialView);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [globalRoom, setGlobalRoom] = useState<ChatRoom | null>(null);
  const [globalMessages, setGlobalMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [messagingStats, setMessagingStats] = useState({
    conversationCount: 0,
    totalUnreadMessages: 0,
    joinedRoomsCount: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversations();
      setConversations(response.conversations);
      setError(null);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        const response = await chatService.getConversationMessages(conversationId);
        setMessages(response.messages);
        setCurrentView('conversation');
        await chatService.markConversationAsRead(conversationId);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalChat = async () => {
    try {
      setLoading(true);
      const roomResponse = await chatService.getGlobalRoom();
      setGlobalRoom(roomResponse.room);
      
      const messagesResponse = await chatService.getRoomMessages(roomResponse.room._id);
      setGlobalMessages(messagesResponse.messages);
      setError(null);
    } catch (err) {
      console.error('Error loading global chat:', err);
      setError('Failed to load global chat');
    } finally {
      setLoading(false);
    }
  };

  const loadMessagingStats = async () => {
    try {
      const response = await chatService.getMessagingStats();
      setMessagingStats(response.stats);
    } catch (err) {
      console.error('Error loading messaging stats:', err);
    }
  };
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      console.log('🔔 New message received:', message);
      
      if (message.messageType === 'global' && currentView === 'global') {
        setGlobalMessages(prev => [...prev, message]);
      } else if (message.messageType === 'direct') {
        if (selectedConversation && message.conversation === selectedConversation._id) {
          setMessages(prev => [...prev, message]);
        }
        loadConversations();
      }
    };

    const handleMessageEdited = (message: Message) => {
      console.log('✏️ Message edited:', message);
      
      if (message.messageType === 'global' && currentView === 'global') {
        setGlobalMessages(prev => prev.map(msg => 
          msg._id === message._id ? message : msg
        ));
      } else if (message.messageType === 'direct' && selectedConversation && message.conversation === selectedConversation._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === message._id ? message : msg
        ));
      }
    };

    const handleMessageDeleted = (data: { messageId: string; conversationId?: string; roomId?: string }) => {
      console.log('🗑️ Message deleted:', data);
      
      if (data.roomId && currentView === 'global') {
        setGlobalMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      } else if (data.conversationId && selectedConversation && data.conversationId === selectedConversation._id) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    };

    const handleConversationRead = (data: { conversationId: string; userId: string }) => {
      setConversations(prev => prev.map(conv => 
        conv._id === data.conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    };

    const handleUserTyping = (data: { conversationId?: string; roomId?: string; username: string }) => {
      console.log('⌨️ User typing:', data);
    };

    const handleUserOnline = (data: { userId: string; username: string }) => {
      console.log('🟢 User online:', data);
    };

    const handleUserOffline = (data: { userId: string; username: string }) => {
      console.log('🔴 User offline:', data);
    };

    socketService.on('message:new', handleNewMessage);
    socketService.on('message:edited', handleMessageEdited);
    socketService.on('message:deleted', handleMessageDeleted);
    socketService.on('conversation:read', handleConversationRead);
    socketService.on('user:typing', handleUserTyping);
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);

    return () => {
      socketService.off('message:new', handleNewMessage);
      socketService.off('message:edited', handleMessageEdited);
      socketService.off('message:deleted', handleMessageDeleted);
      socketService.off('conversation:read', handleConversationRead);
      socketService.off('user:typing', handleUserTyping);
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
    };
  }, [currentView, selectedConversation, loadConversations]);

  useEffect(() => {
    if (currentView === 'global' && globalRoom) {
      socketService.joinRoom(globalRoom._id);
    } else if (currentView === 'conversation' && selectedConversation) {
      socketService.joinRoom(selectedConversation._id);
    }

    return () => {  
      if (globalRoom) {
        socketService.leaveRoom(globalRoom._id);
      }
      if (selectedConversation) {
        socketService.leaveRoom(selectedConversation._id);
      }
    };
  }, [currentView, globalRoom, selectedConversation]);

  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
    loadConversations();
    loadMessagingStats();
  }, [initialConversationId]);

  useEffect(() => {
    if (currentView === 'global') {
      loadGlobalChat();
    }
  }, [currentView]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, globalMessages]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleSendMessage = async (content: string, replyTo?: string) => {
    if (!user) return;

    try {
      if (currentView === 'conversation' && selectedConversation) {
        const response = await chatService.sendMessage(selectedConversation._id, content, replyTo);
        socketService.sendMessage({
          conversationId: selectedConversation._id,
          content,
          replyTo
        });
        loadConversations();
      } else if (currentView === 'global' && globalRoom) {
        const response = await chatService.sendRoomMessage(globalRoom._id, content, replyTo);
        socketService.sendRoomMessage({
          roomId: globalRoom._id,
          content,
          replyTo
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await chatService.editMessage(messageId, newContent);
      
      socketService.editMessage(messageId, newContent);
      
      console.log('Message updated');
    } catch (err) {
      console.error('Error editing message:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatService.deleteMessage(messageId);
      
      socketService.deleteMessage(messageId);
      
      console.log('Message deleted');
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleModerateUser = async (userId: string, action: 'timeout' | 'ban' | 'kick' | 'mute', duration?: number) => {
    if (!globalRoom) return;
    
    try {
      if (action === 'timeout') {
        await chatService.moderateUser(globalRoom._id, userId, 'timeout', duration);
      } else if (action === 'ban') {
        await chatService.moderateUser(globalRoom._id, userId, 'ban', duration);
      } else if (action === 'mute') {
        await chatService.moderateUser(globalRoom._id, userId, 'mute', duration);
      } else if (action === 'kick') {
        await chatService.moderateUser(globalRoom._id, userId, 'kick');
      }
      
      console.log(`User ${action}ed successfully`);
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
    }
  };

  const handleReportMessage = async (messageId: string, reason: string) => {
    try {
      await chatService.reportMessage(messageId, reason);
      console.log('Message reported successfully');
    } catch (err) {
      console.error('Error reporting message:', err);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await chatService.archiveConversation(conversationId);
      loadConversations();
      console.log('Conversation archived');
    } catch (err) {
      console.error('Error archiving conversation:', err);
    }
  };

  const handleStartNewConversation = async (username: string) => {
    try {
      const response = await chatService.createOrGetConversation(username);
      setSelectedConversation(response.conversation);
      loadConversation(response.conversation._id);
      loadConversations();
    } catch (err) {
      console.error('Error starting conversation:', err);
    }
  };

  const renderHeader = () => {
    let title = 'Messages';
    let subtitle = '';
    let actions = [];

    if (currentView === 'conversation' && selectedConversation) {
      const otherUser = chatUtils.getOtherParticipant(selectedConversation, user?.id || '');
      title = otherUser?.username || 'Unknown User';
      subtitle = `Level ${otherUser?.gameData?.level || 1}`;
      actions = [
        { icon: Phone, label: 'Call', action: () => {} },
        { icon: Video, label: 'Video', action: () => {} },
        { icon: Info, label: 'Info', action: () => {} },
        { icon: Archive, label: 'Archive', action: () => handleArchiveConversation(selectedConversation._id) },
      ];
    } else if (currentView === 'global' && globalRoom) {
      title = globalRoom.name;
      subtitle = `${globalRoom.onlineCount} online • ${globalRoom.participantCount} members`;
      actions = [
        { icon: Users, label: 'Members', action: () => {} },
        { icon: Info, label: 'Info', action: () => {} },
        { icon: Settings, label: 'Settings', action: () => {} },
      ];
    } else if (currentView === 'conversations') {
      title = 'Messages';
      subtitle = `${messagingStats.conversationCount} conversations`;
      actions = [
        { icon: Search, label: 'Search', action: () => setShowSearch(!showSearch) },
        { icon: Settings, label: 'Settings', action: () => setCurrentView('settings') },
      ];
    }

    return (
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {currentView !== 'conversations' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('conversations')}
              className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </motion.button>
          )}
          
          <div className="flex items-center space-x-3">
            {currentView === 'global' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Globe size={20} className="text-white" />
              </div>
            )}
            
            {currentView === 'conversation' && selectedConversation && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {actions.map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
              title={action.label}
            >
              <action.icon size={20} className="text-gray-600" />
            </motion.button>
          ))}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 size={20} className="text-gray-600" />
            ) : (
              <Minimize2 size={20} className="text-gray-600" />
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
            title="Close"
          >
            <X size={20} className="text-gray-600" />
          </motion.button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'conversations':
        return (
          <div className="flex-1 flex flex-col">
            <ConversationList
              conversations={conversations}
              onSelectConversation={loadConversation}
              onArchiveConversation={handleArchiveConversation}
              onStartNewConversation={handleStartNewConversation}
              searchQuery={searchQuery}
              currentUserId={user?.id || ''}
            />
          </div>
        );

      case 'global':
        return (
          <div className="flex-1 flex flex-col">
            <MessageList
              messages={globalMessages}
              currentUserId={user?.id || ''}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onReply={(messageId) => {
                console.log('Reply to message:', messageId);
              }}
              onModerateUser={handleModerateUser}
              onReportMessage={handleReportMessage}
              isGlobalChat={true}
            />
            <div ref={messagesEndRef} />
            <MessageInput
              onSendMessage={handleSendMessage}
              placeholder="Message the community..."
            />
          </div>
        );

      case 'conversation':
        return (
          <div className="flex-1 flex flex-col">
            <MessageList
              messages={messages}
              currentUserId={user?.id || ''}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onReply={(messageId) => {
                console.log('Reply to message:', messageId);
              }}
              onModerateUser={handleModerateUser}
              onReportMessage={handleReportMessage}
              isGlobalChat={false}
            />
            <div ref={messagesEndRef} />
            <MessageInput
              onSendMessage={handleSendMessage}
              placeholder={`Message ${selectedConversation ? chatUtils.getOtherParticipant(selectedConversation, user?.id || '')?.username : 'user'}...`}
            />
          </div>
        );

      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <GlassCard className="fixed bottom-4 right-4 w-[400px] bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 rounded-2xl overflow-hidden z-50">
      <AnimatePresence mode="wait">
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 600, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col"
          >
            {renderHeader()}
            {renderContent()}
          </motion.div>
        )}
        
        {isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderHeader()}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

export default ChatWindow; 