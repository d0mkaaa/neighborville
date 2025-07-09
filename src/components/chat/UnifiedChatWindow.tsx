import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Globe, MessageCircle, Plus, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { handleChatError, isSecurityError } from '../../utils/chatErrorHandler';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ConversationList from './ConversationList';
import StartDMModal from './StartDMModal';
import { chatService, type Message, type ChatRoom, type Conversation } from '../../services/chatService';
import socketService from '../../services/socketService';
import { logger } from '../../utils/logger';

interface UnifiedChatWindowProps {
  onClose: () => void;
  onMessageNotification?: (message: Message) => void;
  addNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info', autoRemove?: boolean) => void;
}

const UnifiedChatWindow: React.FC<UnifiedChatWindowProps> = ({
  onClose,
  onMessageNotification,
  addNotification
}) => {
  const { user, socketStatus, isSocketAuthenticated } = useAuth();

  const showChatError = useCallback((error: any, fallbackMessage?: string) => {
    try {
      const errorDetails = handleChatError(error);
      
      const fullMessage = errorDetails.actionable 
        ? `${errorDetails.message} ${errorDetails.actionable}`
        : errorDetails.message;
      
      if (addNotification) {
        addNotification(fullMessage, errorDetails.type, true);
      } else {
        console.error('Chat Error:', fullMessage);
      }
      
      if (isSecurityError(error)) {
        console.warn('🛡️ Security error in chat:', errorDetails);
      }
    } catch (err) {
      if (addNotification) {
        addNotification(fallbackMessage || 'An error occurred', 'error', true);
      } else {
        console.error('Error parsing chat error:', err);
      }
    }
  }, [addNotification]);
  
  const [activeTab, setActiveTab] = useState<'global' | 'dm'>('global');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showStartDM, setShowStartDM] = useState(false);
  
  const [globalChannel, setGlobalChannel] = useState<ChatRoom | null>(null);
  const [globalMessages, setGlobalMessages] = useState<Message[]>([]);
  const [globalUserCount, setGlobalUserCount] = useState<number>(0);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; sender: string } | null>(null);
  
  const mounted = useRef(true);
  const activeConversationRef = useRef<Conversation | null>(null);
  const activeTabRef = useRef<string>('global');
  
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    console.log('🚀 CHAT INIT: Component mounting, user:', user?.username);
    
    const initializeChat = async () => {
      try {
        console.log('🚀 CHAT INIT: Starting initialization...');
        
        console.log('🚀 CHAT INIT: Setting up socket listeners...');
        setupSocketListeners();
        
        console.log('🚀 CHAT INIT: Socket managed by AuthContext, status:', socketStatus);
        
        console.log('🚀 CHAT INIT: Loading global channel...');
        await loadGlobalChannel();
        
        console.log('🚀 CHAT INIT: Loading conversations...');
        await loadConversations();
        
        console.log('🚀 CHAT INIT: Initialization complete!');
      } catch (error) {
        console.error('🚀 CHAT INIT ERROR: Failed to initialize chat:', error);
        if (addNotification) {
          addNotification('Failed to load chat', 'error', true);
        }
      }
    };

    if (user) {
      initializeChat();
    } else {
      console.log('🚀 CHAT INIT: No user, skipping initialization');
    }
    
    return () => {
      console.log('🚀 CHAT CLEANUP: Cleaning up socket listeners...');
      cleanupSocketListeners();
    };
  }, [user]);

  const loadGlobalMessages = useCallback(async (channelId: string) => {
    console.log('📥 LOAD MESSAGES: Starting to load global messages for channel:', channelId);
    console.log('📥 LOAD MESSAGES: Channel ID type:', typeof channelId);
    console.log('📥 LOAD MESSAGES: Channel ID length:', channelId?.length);
    
    if (!channelId) {
      console.error('📥 LOAD MESSAGES ERROR: No channelId provided');
      return;
    }
    
    try {
      console.log('📥 LOAD MESSAGES: Setting loading state to true...');
      setIsLoadingMessages(true);
      
      console.log('📥 LOAD MESSAGES: Calling chatService.getGlobalMessages...');
      const response = await chatService.getGlobalMessages(channelId);
      console.log('📥 LOAD MESSAGES: Raw response:', response);
      console.log('📥 LOAD MESSAGES: Response success:', response.success);
      console.log('📥 LOAD MESSAGES: Response messages:', response.messages);
      
      if (!mounted.current) {
        console.log('📥 LOAD MESSAGES: Component unmounted before setting messages');
        return;
      }
      
      const messages = response.messages || [];
      console.log('📥 LOAD MESSAGES: Final messages count:', messages.length);
      console.log('📥 LOAD MESSAGES: Setting global messages...');
      setGlobalMessages(messages);
      console.log('📥 LOAD MESSAGES: ✅ Global messages set successfully!');
    } catch (error) {
      console.error('📥 LOAD MESSAGES ERROR: Failed to load global messages:', error);
      console.error('📥 LOAD MESSAGES ERROR: Error details:', error);
      if (addNotification) {
        addNotification('Failed to load messages: ' + (error as Error).message, 'error', true);
      }
    } finally {
      if (mounted.current) {
        console.log('📥 LOAD MESSAGES: Setting loading to false');
        setIsLoadingMessages(false);
      } else {
        console.log('📥 LOAD MESSAGES: Component unmounted, not setting loading to false');
      }
    }
  }, []);

  const loadGlobalChannel = useCallback(async () => {
    try {
      console.log('🏠 LOAD CHANNEL: Starting to load global channel...');
      const response = await chatService.getGlobalChannel();
      console.log('🏠 LOAD CHANNEL: Response received:', response);
      console.log('🏠 LOAD CHANNEL: Channel object:', response.channel);
      console.log('🏠 LOAD CHANNEL: Channel ID:', response.channel?._id);
      
      if (!mounted.current) {
        console.log('🏠 LOAD CHANNEL: Component unmounted before setting channel');
        return;
      }
      
      setGlobalChannel(response.channel);
      console.log('🏠 LOAD CHANNEL: Set global channel with ID:', response.channel._id);
      
      if (response.channel && response.channel._id) {
        console.log('🏠 LOAD CHANNEL: Joining global room:', response.channel._id);
        socketService.joinRoom(response.channel._id);
        
        if (socketService.isSocketConnected() && socketService.isSocketAuthenticated()) {
          socketService.getSocket()?.emit('request_room_user_count', response.channel._id);
        }
        
        console.log('🏠 LOAD CHANNEL: About to load global messages...');
        await loadGlobalMessages(response.channel._id);
        console.log('🏠 LOAD CHANNEL: ✅ Global messages loading completed');
      } else {
        console.error('🏠 LOAD CHANNEL ERROR: No valid channel or channel ID found');
      }
    } catch (error) {
      console.error('🏠 LOAD CHANNEL ERROR: Failed to load global channel:', error);
      showChatError(error, 'Failed to load global chat');
    }
  }, [loadGlobalMessages]);

  const loadConversations = useCallback(async () => {
    try {
      console.log('💬 LOAD CONVS: Loading conversations...');
      const response = await chatService.getConversations();
      if (!mounted.current) return;
      
      console.log('💬 LOAD CONVS: Loaded conversations:', response.conversations?.length || 0);
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('💬 LOAD CONVS ERROR: Failed to load conversations:', error);
      showChatError(error, 'Failed to load conversations');
    }
  }, []);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await chatService.getConversationMessages(conversationId);
      if (!mounted.current) return;
      
      setConversationMessages(response.messages || []);
      
      socketService.joinRoom(conversationId);
    } catch (error) {
      console.error('❌ Error loading conversation messages:', error);
      showChatError(error, 'Failed to load conversation messages');
    } finally {
      if (mounted.current) {
        setIsLoadingMessages(false);
      }
    }
  }, []);

  const handleNewGlobalMessage = useCallback((message: Message) => {
    if (message.messageType === 'global') {
      setGlobalMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
      
      if (activeTabRef.current !== 'global') {
        onMessageNotification?.(message);
      }
    }
  }, [onMessageNotification]);

  const handleGlobalMessageDeleted = useCallback((data: { messageId: string }) => {
    console.log('🗑️ Global message deleted:', data.messageId);
    setGlobalMessages(prev => prev.filter(msg => msg._id !== data.messageId));
  }, []);

  const handleNewDirectMessage = useCallback((message: Message) => {
    if (message.messageType === 'direct' && message.conversation) {
      if (activeConversationRef.current?._id === message.conversation) {
        setConversationMessages(prev => {
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
      }

      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv._id === message.conversation) {
            return { ...conv, lastMessage: message, updatedAt: new Date().toISOString() };
          }
          return conv;
        });
        
        return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
      
      if (activeTabRef.current !== 'dm' || activeConversationRef.current?._id !== message.conversation) {
        onMessageNotification?.(message);
      }
    }
  }, [onMessageNotification]);

  const handleDirectMessageDeleted = useCallback((data: { messageId: string; conversationId?: string }) => {
    if (data.conversationId === activeConversation?._id) {
      setConversationMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    }
  }, [activeConversation]);

  const handleNewConversation = useCallback(async (conversation: Conversation) => {
    setConversations(prev => {
      const exists = prev.some(conv => conv._id === conversation._id);
      if (exists) return prev;
      return [conversation, ...prev];
    });
    
    await loadConversations();
  }, [loadConversations]);

  const updateGlobalUserCount = useCallback(() => {
    if (globalChannel && socketService.isSocketConnected() && socketService.isSocketAuthenticated()) {
      socketService.getSocket()?.emit('request_room_user_count', globalChannel._id);
    }
  }, [globalChannel]);

  const refreshOnlineUsers = useCallback(() => {
    if (socketService.isSocketConnected() && socketService.isSocketAuthenticated()) {
      socketService.getSocket()?.emit('request_online_users');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'global') {
      updateGlobalUserCount();
    }
  }, [activeTab, updateGlobalUserCount]);

  const setupSocketListeners = useCallback(() => {
    socketService.on('global:message:new', handleNewGlobalMessage);
    socketService.on('global:message:deleted', handleGlobalMessageDeleted);
    
    socketService.on('message:new', handleNewDirectMessage);
    socketService.on('message:deleted', handleDirectMessageDeleted);
    
    socketService.on('conversation:new', handleNewConversation);
    
    socketService.on('user_status_changed', (data: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });

    socketService.on('online_users_list', (data: { onlineUsers: string[] }) => {
      setOnlineUsers(new Set(data.onlineUsers));
    });

    socketService.on('room_user_count', (data: { roomId: string; userCount: number }) => {
      if (globalChannel && data.roomId === globalChannel._id) {
        setGlobalUserCount(data.userCount);
      }
    });
    
    socketService.on('authenticated', () => {
      refreshOnlineUsers();
    });
  }, [handleNewGlobalMessage, handleGlobalMessageDeleted, handleNewDirectMessage, handleDirectMessageDeleted, handleNewConversation, refreshOnlineUsers, globalChannel]);

  const cleanupSocketListeners = useCallback(() => {
    socketService.off('global:message:new', handleNewGlobalMessage);
    socketService.off('global:message:deleted', handleGlobalMessageDeleted);
    
    socketService.off('message:new', handleNewDirectMessage);
    socketService.off('message:deleted', handleDirectMessageDeleted);
    
    socketService.off('conversation:new', handleNewConversation);
  }, [handleNewGlobalMessage, handleGlobalMessageDeleted, handleNewDirectMessage, handleDirectMessageDeleted, handleNewConversation]);

  const handleConversationSelect = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    activeConversationRef.current = conversation;
    setActiveTab('dm');
    activeTabRef.current = 'dm';
    await loadConversationMessages(conversation._id);
  };

  const handleConversationStarted = async (conversation: Conversation) => {
    setShowStartDM(false);
    
    setConversations(prev => {
      const exists = prev.some(conv => conv._id === conversation._id);
      if (exists) return prev;
      return [conversation, ...prev];
    });
    
    await loadConversations();
    
    handleConversationSelect(conversation);
  };

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      console.log('🗑️ Deleting message:', messageId);
      await chatService.deleteMessage(messageId);
      if (addNotification) {
        addNotification('Message deleted', 'success', true);
      }
    } catch (error) {
      console.error('🗑️ Failed to delete message:', error);
      if (addNotification) {
        addNotification('Failed to delete message', 'error', true);
      }
    }
  }, [addNotification]);

  const handleSendMessage = useCallback(async (content: string, replyToId?: string) => {
    console.log('📤 SEND MESSAGE: Attempting to send message...');
    console.log('📤 SEND MESSAGE: Content:', content);
    console.log('📤 SEND MESSAGE: Active tab:', activeTab);
    console.log('📤 SEND MESSAGE: Global channel:', globalChannel?._id);
    console.log('📤 SEND MESSAGE: Active conversation:', activeConversation?._id);
    
    try {
      if (activeTab === 'global' && globalChannel) {
        console.log('📤 SEND MESSAGE: Sending global message...');
        const messageData = {
          content,
          roomId: globalChannel._id,
          replyTo: replyToId || replyTo?.id || undefined
        };
        
        console.log('📤 SEND MESSAGE: Message data:', messageData);
        const result = await chatService.sendGlobalMessage(globalChannel._id, messageData);
        console.log('📤 SEND MESSAGE: Global message sent successfully:', result);
        setReplyTo(null);
        
        if (content.length > 100 || content.includes('@')) {
          if (addNotification) {
            addNotification('Message sent successfully', 'success', true);
          }
        }
        
      } else if (activeTab === 'dm' && activeConversation) {
        console.log('📤 SEND MESSAGE: Sending DM...');
        const messageData = {
          content,
          conversationId: activeConversation._id,
          replyTo: replyToId || replyTo?.id || undefined
        };
        
        console.log('📤 SEND MESSAGE: DM data:', messageData);
        const result = await chatService.sendConversationMessage(activeConversation._id, messageData);
        console.log('📤 SEND MESSAGE: DM sent successfully:', result);
        setReplyTo(null);
        
        if (addNotification) {
          addNotification('Private message sent', 'success', true);
        }
      } else {
        console.error('📤 SEND MESSAGE ERROR: Invalid state for sending message');
        console.error('📤 SEND MESSAGE ERROR: Active tab:', activeTab);
        console.error('📤 SEND MESSAGE ERROR: Has global channel:', !!globalChannel);
        console.error('📤 SEND MESSAGE ERROR: Has active conversation:', !!activeConversation);
      }
    } catch (error) {
      console.error('📤 SEND MESSAGE ERROR: Failed to send message:', error);
      showChatError(error, 'Failed to send message');
    }
  }, [activeTab, globalChannel, activeConversation, replyTo]);

  const getCurrentMessages = () => {
    if (activeTab === 'global') {
      return globalMessages;
    } else if (activeTab === 'dm' && activeConversation) {
      return conversationMessages;
    }
    return [];
  };

  const getCurrentChatTitle = () => {
    if (activeTab === 'global') {
      return {
        title: 'Global Chat',
        subtitle: globalUserCount > 0 ? `${globalUserCount} online` : 'Loading...',
        icon: <Globe size={18} />
      };
    } else if (activeTab === 'dm' && activeConversation) {
      const otherUser = activeConversation.participants.find(p => p._id !== user?.id);
      return {
        title: otherUser ? `${otherUser.username}` : 'Direct Message',
        subtitle: '',
        icon: <MessageCircle size={18} />
      };
    }
    return {
      title: 'Chat',
      subtitle: '',
      icon: <MessageCircle size={18} />
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        const status = socketService.getStatus();
                 const debugInfo = {
           ...status,
           onlineUsersCount: onlineUsers.size,
           onlineUsersList: Array.from(onlineUsers),
           currentUser: user?.id,
           socketStatus,
           isSocketAuthenticated
         };
        console.log('🐛 Debug Info:', debugInfo);
        alert(JSON.stringify(debugInfo, null, 2));
      } else if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        console.log('🔄 Force refreshing online users...');
        refreshOnlineUsers();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onlineUsers, user, socketStatus, isSocketAuthenticated, refreshOnlineUsers]);

  if (!user) {
    console.log('❌ No user, not rendering chat');
    return null;
  }

  return (
      <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed bottom-4 right-4 w-[480px] h-[600px] bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden z-50 ring-1 ring-black/5"
      >
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white shadow-lg border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1 bg-white/10 rounded-lg p-1 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('global')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                activeTab === 'global' 
                  ? 'bg-white/25 shadow-sm scale-105' 
                  : 'hover:bg-white/15 hover:scale-102'
              }`}
              title="Global Chat"
            >
              <Globe size={18} />
            </button>
            <button
              onClick={() => setActiveTab('dm')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                activeTab === 'dm' 
                  ? 'bg-white/25 shadow-sm scale-105' 
                  : 'hover:bg-white/15 hover:scale-102'
              }`}
              title="Direct Messages"
            >
              <MessageCircle size={18} />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {getCurrentChatTitle().icon}
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                {getCurrentChatTitle().title}
              </span>
              {getCurrentChatTitle().subtitle && (
                <span className="text-xs text-white/80 leading-tight flex items-center">
                  {activeTab === 'global' && (
                    <Users size={10} className="mr-1" />
                  )}
                  {getCurrentChatTitle().subtitle}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {activeTab === 'dm' && (
            <button
              onClick={() => setShowStartDM(true)}
              className="p-2 hover:bg-white/15 rounded-lg transition-all duration-200 hover:scale-105"
              title="Start New Conversation"
            >
              <Plus size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/15 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100%-4rem)]">
        {activeTab === 'dm' && (
          <div className="w-1/3 border-r border-gray-200/60">
                         <ConversationList
               conversations={conversations}
               searchQuery=""
               onSelectConversation={(conversationId) => {
                 const conversation = conversations.find(conv => conv._id === conversationId);
                 if (conversation) {
                   handleConversationSelect(conversation);
                 }
               }}
               onArchiveConversation={() => {}}
               onStartNewConversation={() => setShowStartDM(true)}
               onGlobalChatClick={() => setActiveTab('global')}
               currentUserId={user.id}
             />
          </div>
        )}

        <div className={`flex flex-col ${activeTab === 'dm' ? 'w-2/3' : 'w-full'}`}>
        <div className="flex-1 overflow-hidden">
          {isLoadingMessages ? (
               <div className="flex-1 flex items-center justify-center h-full">
                 <div className="flex flex-col items-center space-y-2">
                   <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-gray-500 text-xs">Loading messages...</p>
                 </div>
            </div>
          ) : (
            <MessageList
                 messages={getCurrentMessages()}
                 currentUserId={user.id}
                 onReply={(messageId) => {
                   const message = getCurrentMessages().find(m => m._id === messageId);
                   if (message) {
                     setReplyTo({
                       id: messageId,
                       content: message.content,
                       sender: message.sender.username
                     });
                   }
                 }}
                 onEditMessage={() => {}}
                 onDeleteMessage={handleDeleteMessage}
                 isGlobalChat={activeTab === 'global'}
                 onlineUsers={onlineUsers}
            />
          )}
        </div>

           <div className="border-t border-gray-200/60 bg-white/95 backdrop-blur-sm">
             <MessageInput
               onSendMessage={async (content, replyToId) => {
                 await handleSendMessage(content, replyToId);
               }}
               replyTo={replyTo ? {
                 id: replyTo.id,
                 content: replyTo.content,
                 sender: replyTo.sender
               } : undefined}
               onCancelReply={() => setReplyTo(null)}
              disabled={activeTab === 'dm' && !activeConversation}
              placeholder={
                activeTab === 'global' 
                  ? "Message global chat..." 
                  : activeConversation 
                    ? "Type a message..." 
                    : "Select a conversation to start messaging"
              }
            />
          </div>
        </div>
      </div>

      <StartDMModal
        isOpen={showStartDM}
        onClose={() => setShowStartDM(false)}
        onConversationStarted={handleConversationStarted}
      />
      </motion.div>
  );
};

export default UnifiedChatWindow; 