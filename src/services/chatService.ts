import { api } from '../utils/api';
import { buildApiEndpoint } from '../config/apiConfig';

export interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
    gameData: {
      level: number;
    };
  };
  messageType: 'direct' | 'global' | 'system';
  conversation?: string;
  chatRoom?: string;
  replyTo?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      username: string;
    };
  };
  status?: 'sent' | 'delivered' | 'read' | 'deleted';
  metadata?: {
    edited?: boolean;
    editedAt?: string;
  };
  readBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    username: string;
    gameData: {
      level: number;
    };
  }>;
  type: 'direct' | 'group';
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  _id: string;
  name: string;
  description: string;
  roomType: 'global' | 'regional' | 'topic' | 'level-based' | 'private';
  participants?: string[];
  settings?: {
    isPublic: boolean;
    maxParticipants: number;
    allowImages: boolean;
    allowLinks: boolean;
    profanityFilter: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  username: string;
  gameData: {
    level: number;
  };
}

export interface DMRequest {
  _id: string;
  requester: {
    _id: string;
    username: string;
  };
  recipient: {
    _id: string;
    username: string;
  };
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface CreateConversationRequest {
  recipientUsername: string;
}

export interface SendMessageRequest {
  content: string;
  replyTo?: string;
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface ChannelResponse {
  success: boolean;
  channel: ChatRoom;
}

export interface ChannelMessagesResponse {
  success: boolean;
  messages: Message[];
  channel: {
    name: string;
    description: string;
    participantCount: number;
  };
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface UserSearchResponse {
  success: boolean;
  users: User[];
}

class ChatService {
  async getConversations(page: number = 1, limit: number = 20): Promise<ConversationsResponse> {
    const response = await api.get(buildApiEndpoint(`/api/messaging/conversations?page=${page}&limit=${limit}`));
    return response;
  }

  async createConversation(data: CreateConversationRequest): Promise<{ success: boolean; conversation: Conversation }> {
    const response = await api.post(buildApiEndpoint('/api/messaging/conversations'), data);
    return response;
  }

  async getConversationMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<MessagesResponse> {
    const response = await api.get(buildApiEndpoint(`/api/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`));
    return response;
  }

  async sendConversationMessage(conversationId: string, data: SendMessageRequest): Promise<{ success: boolean; message: Message }> {
    const response = await api.post(buildApiEndpoint(`/api/messaging/conversations/${conversationId}/messages`), data);
    return response;
  }

  async getGlobalChannel(): Promise<ChannelResponse> {
    const response = await api.get(buildApiEndpoint('/api/messaging/channels/global'));
    return response;
  }

  async getGlobalMessages(channelId: string, page: number = 1, limit: number = 50): Promise<ChannelMessagesResponse> {
    const response = await api.get(buildApiEndpoint(`/api/messaging/channels/${channelId}/messages?page=${page}&limit=${limit}`));
    return response;
  }

  async sendGlobalMessage(channelId: string, messageData: { content: string; replyTo?: string }): Promise<{ success: boolean; message: Message }> {
    console.log('📤 ChatService: Sending global message to channel:', channelId);
    const endpoint = buildApiEndpoint(`/api/messaging/channels/${channelId}/messages`);
    console.log('📤 ChatService: Send endpoint:', endpoint);
    
    try {
      const response = await api.post(endpoint, messageData);
      console.log('📤 ChatService: Send response:', response);
      return { success: true, message: response.message };
    } catch (error: any) {
      console.error('📤 ChatService: Send error:', error);
      
      if (error?.response?.status === 400 && error?.response?.data?.moderation) {
        const moderation = error.response.data.moderation;
        throw new Error(`Message blocked: ${moderation.reason}${moderation.cleanedText ? '. Suggested: ' + moderation.cleanedText : ''}`);
      }
      
      throw error;
    }
  }

  async editMessage(messageId: string, newContent: string): Promise<{ success: boolean; message: Message }> {
    console.log('✏️ ChatService: Editing message:', messageId);
    const endpoint = buildApiEndpoint(`/api/messaging/messages/${messageId}`);
    console.log('✏️ ChatService: Edit endpoint:', endpoint);
    
    try {
      const response = await api.put(endpoint, { content: newContent });
      console.log('✏️ ChatService: Edit response:', response);
      return response;
    } catch (error: any) {
      console.error('✏️ ChatService: Edit error:', error);
      
      if (error?.response?.status === 400 && error?.response?.data?.moderation) {
        const moderation = error.response.data.moderation;
        throw new Error(`Edit blocked: ${moderation.reason}${moderation.cleanedText ? '. Suggested: ' + moderation.cleanedText : ''}`);
      }
      
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean; message: string }> {
    console.log('🗑️ ChatService: Deleting message:', messageId);
    const endpoint = buildApiEndpoint(`/api/messaging/messages/${messageId}`);
    console.log('🗑️ ChatService: Delete endpoint:', endpoint);
    
    const response = await api.delete(endpoint);
    console.log('🗑️ ChatService: Delete response:', response);
    return response;
  }

  async searchUsers(query: string): Promise<UserSearchResponse> {
    const response = await api.get(buildApiEndpoint(`/api/messaging/users/search?query=${encodeURIComponent(query)}`));
    return response;
  }

  async moderateUser(roomId: string, userId: string, action: 'timeout' | 'ban' | 'mute' | 'kick', duration?: number): Promise<{ success: boolean; message: string }> {
    console.log(`🛡️ ChatService: Moderating user ${userId} in room ${roomId} with action ${action}`);
    const endpoint = buildApiEndpoint(`/api/messaging/rooms/${roomId}/moderate`);
    
    const moderationData = {
      userId,
      action,
      ...(duration && { duration })
    };
    
    const response = await api.post(endpoint, moderationData);
    console.log('🛡️ ChatService: Moderation response:', response);
    return response;
  }

  async reportMessage(messageId: string, reason: string): Promise<{ success: boolean; message: string }> {
    console.log(`🚨 ChatService: Reporting message ${messageId} for reason: ${reason}`);
    const endpoint = buildApiEndpoint(`/api/messaging/messages/${messageId}/report`);
    
    const response = await api.post(endpoint, { reason });
    console.log('🚨 ChatService: Report response:', response);
    return response;
  }

  async archiveConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    console.log(`📁 ChatService: Archiving conversation ${conversationId}`);
    const endpoint = buildApiEndpoint(`/api/messaging/conversations/${conversationId}/archive`);
    
    const response = await api.post(endpoint, {});
    console.log('📁 ChatService: Archive response:', response);
    return response;
  }

  async createOrGetConversation(username: string): Promise<{ success: boolean; conversation: Conversation }> {
    console.log(`💬 ChatService: Creating or getting conversation with ${username}`);
    
    const data: CreateConversationRequest = { recipientUsername: username };
    return await this.createConversation(data);
  }

  shouldGroupMessage(currentMessage: Message, previousMessage?: Message): boolean {
    if (!previousMessage) return false;
    
    if (currentMessage.sender._id !== previousMessage.sender._id) return false;
    
    const current = new Date(currentMessage.createdAt);
    const previous = new Date(previousMessage.createdAt);
    const diffMs = current.getTime() - previous.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMs < 30000) return true;
    if (diffMins < 2) return true;
    
    return false;
  }

  async getGlobalRoom(): Promise<ChannelResponse> {
    return this.getGlobalChannel();
  }

  async getGlobalChatMessages(roomId: string, page: number = 1, limit: number = 50): Promise<ChannelMessagesResponse> {
    return this.getGlobalMessages(roomId, page, limit);
  }

  async sendGlobalChatMessage(roomId: string, data: SendMessageRequest): Promise<{ success: boolean; message: Message }> {
    return this.sendGlobalMessage(roomId, data);
  }
}

export const chatService = new ChatService();

export const chatUtils = {
  getOtherParticipant: (conversation: Conversation, currentUserId: string) => {
    console.log('🔍 getOtherParticipant Debug:', {
      currentUserId,
      participants: conversation.participants.map(p => ({ id: p._id, username: p.username }))
    });
    
    const validParticipants = conversation.participants.filter(p => p && p._id && p.username);
    
    const otherUser = validParticipants.find(p => {
      const participantId = String(p._id);
      const userId = String(currentUserId);
      const isMatch = participantId !== userId;
      console.log('🔍 Comparing:', {
        participantId,
        userId,
        isMatch,
        username: p.username
      });
      return isMatch;
    });
    
    console.log('🔍 Found other user:', otherUser ? otherUser.username : 'NONE');
    return otherUser;
  },

  formatTimeOnly: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  },

  isMessageFromCurrentUser: (message: Message, currentUserId: string): boolean => {
    return message.sender._id === currentUserId;
  },

  shouldShowTimestamp: (currentMessage: Message, previousMessage?: Message): boolean => {
    if (!previousMessage) return true;
    
    const current = new Date(currentMessage.createdAt);
    const previous = new Date(previousMessage.createdAt);
    const diffMs = current.getTime() - previous.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    return diffMins >= 3 || currentMessage.sender._id !== previousMessage.sender._id;
  },

  shouldGroupMessage: (currentMessage: Message, previousMessage?: Message): boolean => {
    return chatService.shouldGroupMessage(currentMessage, previousMessage);
  },

  validateMessageContent: (content: string): { isValid: boolean; error?: string } => {
    const trimmed = content.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    
    if (trimmed.length > 1000) {
      return { isValid: false, error: 'Message is too long (max 1000 characters)' };
    }
    
    const inappropriateWords = ['spam', 'scam'];
    const hasInappropriate = inappropriateWords.some(word => 
      trimmed.toLowerCase().includes(word.toLowerCase())
    );
    
    if (hasInappropriate) {
      return { isValid: false, error: 'Message contains inappropriate content' };
    }
    
    return { isValid: true };
  }
};

export default chatService; 