import { io, Socket } from 'socket.io-client';
import type { Message, Conversation, ChatRoom } from './chatService';
import { logger } from '../utils/logger';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  level?: number;
  isOnline?: boolean;
}

interface SocketEvents {
  authenticated: (data: { userId: string; user: User }) => void;
  auth_error: (error: string) => void;
  
  new_message: (message: Message) => void;
  'message:new': (message: Message) => void;
  'global:message:new': (message: Message) => void;
  'message:edited': (message: Message) => void;
  'message:deleted': (data: { messageId: string; conversationId?: string; roomId?: string }) => void;
  'global:message:deleted': (data: { messageId: string; channelId?: string }) => void;
  message_sent: (data: { messageId: string }) => void;
  message_error: (error: string) => void;
  message_read: (data: { messageId: string; readBy: string; readAt: string }) => void;
  
  'conversation:read': (data: { conversationId: string; userId: string }) => void;
  'conversation:new': (conversation: Conversation) => void;
  
  'dm_request:received': (request: any) => void;
  'dm_request:accepted': (data: { requestId: string; conversation: any }) => void;
  'dm_request:declined': (data: { requestId: string }) => void;
  
  room_joined: (data: { roomId: string; room: ChatRoom }) => void;
  room_error: (error: string) => void;
  user_joined_room: (data: { userId: string; user: User; roomId: string }) => void;
  user_left_room: (data: { userId: string; user: User; roomId: string }) => void;
  room_user_count: (data: { roomId: string; userCount: number }) => void;
  
  user_typing: (data: { userId: string; user: User; roomId?: string; conversationId?: string }) => void;
  'user:typing': (data: { conversationId?: string; roomId?: string; username: string }) => void;
  user_stop_typing: (data: { userId: string; roomId?: string; conversationId?: string }) => void;
  
  user_status_changed: (data: { userId: string; status: 'online' | 'offline' }) => void;
  online_users_list: (data: { onlineUsers: string[] }) => void;
  'user:online': (data: { userId: string; username: string }) => void;
  'user:offline': (data: { userId: string; username: string }) => void;
  
  notification: (notification: any) => void;
  
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private isConnected = false;
  private isAuthenticated = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private pendingRoomJoins: string[] = [];

  constructor() {
    this.setupSocket();
  }

  private setupSocket() {
    const serverUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : process.env.REACT_APP_API_URL || 'http://localhost:3001';

    this.socket = io(serverUrl, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.socket('Connected to WebSocket server', 'Socket ID:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      logger.socket('Disconnected from WebSocket server:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.pendingRoomJoins = [];
      this.emit('disconnect');
      
      if (reason === 'io server disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      logger.error('WebSocket connection error:', error);
      this.emit('connect_error', error);
      this.attemptReconnect();
    });

    this.socket.on('new_message', (message: Message) => {
      this.emit('new_message', message);
    });

    this.socket.on('message:new', (message: Message) => {
      this.emit('message:new', message);
    });

    this.socket.on('global:message:new', (message: Message) => {
      this.emit('message:new', message);
      this.emit('global:message:new', message);
    });

    this.socket.on('message:edited', (message: Message) => {
      this.emit('message:edited', message);
    });

    this.socket.on('message:deleted', (data: { messageId: string; conversationId?: string; roomId?: string }) => {
      this.emit('message:deleted', data);
    });

    this.socket.on('global:message:deleted', (data: { messageId: string; channelId?: string }) => {
      this.emit('global:message:deleted', data);
    });

    this.socket.on('message_sent', (data: { messageId: string }) => {
      this.emit('message_sent', data);
    });

    this.socket.on('message_error', (error: string) => {
      this.emit('message_error', error);
    });

    this.socket.on('message_read', (data: { messageId: string; readBy: string; readAt: string }) => {
      this.emit('message_read', data);
    });

    this.socket.on('room_joined', (data: { roomId: string; room: ChatRoom }) => {
      logger.socket('Successfully joined room:', data.roomId);
      this.emit('room_joined', data);
    });

    this.socket.on('room_error', (error: string) => {
      logger.error('Room join error:', error);
      this.emit('room_error', error);
    });

    this.socket.on('user_joined_room', (data: { userId: string; user: User; roomId: string }) => {
      this.emit('user_joined_room', data);
    });

    this.socket.on('user_left_room', (data: { userId: string; user: User; roomId: string }) => {
      this.emit('user_left_room', data);
    });

    this.socket.on('room_user_count', (data: { roomId: string; userCount: number }) => {
      this.emit('room_user_count', data);
    });

    this.socket.on('user_typing', (data: { userId: string; user: User; roomId?: string; conversationId?: string }) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user:typing', (data: { conversationId?: string; roomId?: string; username: string }) => {
      this.emit('user:typing', data);
    });

    this.socket.on('user_stop_typing', (data: { userId: string; roomId?: string; conversationId?: string }) => {
      this.emit('user_stop_typing', data);
    });

    this.socket.on('user_status_changed', (data: { userId: string; status: 'online' | 'offline' }) => {
      this.emit('user_status_changed', data);
    });

    this.socket.on('online_users_list', (data: { onlineUsers: string[] }) => {
      this.emit('online_users_list', data);
    });

    this.socket.on('user:online', (data: { userId: string; username: string }) => {
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data: { userId: string; username: string }) => {
      this.emit('user:offline', data);
    });

    this.socket.on('authenticated', (data: { userId: string; user: User }) => {
      logger.auth('Socket authenticated successfully:', data.user.username);
      this.isAuthenticated = true;
      
      if (this.pendingRoomJoins.length > 0) {
        logger.socket('Processing pending room joins:', this.pendingRoomJoins);
        this.pendingRoomJoins.forEach(roomId => {
          if (this.socket) {
            this.socket.emit('join_room', roomId);
          }
        });
        this.pendingRoomJoins = [];
      }
      
      this.emit('authenticated', data);
    });

    this.socket.on('auth_error', (error: string) => {
      logger.error('Socket authentication error:', error);
      this.isAuthenticated = false;
      this.pendingRoomJoins = [];
      this.emit('auth_error', error);
    });

    this.socket.on('notification', (notification: any) => {
      logger.debug('Notification received:', notification);
      
      if (notification.type === 'dm_request:received') {
        this.emit('dm_request:received', notification.data);
      } else if (notification.type === 'dm_request:accepted') {
        this.emit('dm_request:accepted', notification.data);
      } else if (notification.type === 'dm_request:declined') {
        this.emit('dm_request:declined', notification.data);
      } else {
        this.emit('notification', notification);
      }
    });

    this.socket.on('conversation:read', (data: { conversationId: string; userId: string }) => {
      this.emit('conversation:read', data);
    });

    this.socket.on('conversation:new', (conversation: Conversation) => {
      this.emit('conversation:new', conversation);
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.warn('Max reconnection attempts reached');
      this.emit('connect_error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    
    logger.socket(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.socket && !this.isConnected) {
        logger.socket('Executing reconnection attempt');
        this.connect();
      }
    }, delay);
  }

  connect() {
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  authenticate(token: string) {
    if (this.socket) {
      logger.auth('Authenticating with token');
      this.socket.emit('authenticate', token);
    } else {
      logger.warn('Cannot authenticate - socket not available');
    }
  }

  sendMessage(data: {
    content: string;
    type?: 'direct' | 'global' | 'system';
    conversationId?: string;
    roomId?: string;
    replyTo?: string;
    attachments?: any[];
  }) {
    if (this.socket) {
      logger.debug('Sending message:', data);
      this.socket.emit('send_message', data);
    } else {
      logger.warn('Cannot send message - socket not available');
    }
  }

  sendRoomMessage(data: {
    roomId: string;
    content: string;
    replyTo?: string;
  }) {
    if (this.socket) {
      this.socket.emit('send_room_message', data);
    }
  }

  editMessage(messageId: string, content: string) {
    if (this.socket) {
      this.socket.emit('edit_message', { messageId, content });
    }
  }

  deleteMessage(messageId: string) {
    if (this.socket) {
      this.socket.emit('delete_message', { messageId });
    }
  }

  markMessageAsRead(messageId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', { messageId });
    }
  }

  joinRoom(roomId: string) {
    if (!this.socket || !this.isConnected) {
      logger.warn('Cannot join room - socket not connected');
      return;
    }

    if (!this.isAuthenticated) {
      logger.socket('Queueing room join until authentication completes:', roomId);
      if (!this.pendingRoomJoins.includes(roomId)) {
        this.pendingRoomJoins.push(roomId);
      }
      return;
    }

    logger.socket('Joining room:', roomId);
    this.socket.emit('join_room', roomId);
  }

  leaveRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room', roomId);
    }
  }

  startTyping(data: { roomId?: string; conversationId?: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', data);
    }
  }

  stopTyping(data: { roomId?: string; conversationId?: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', data);
    }
  }

  handleTyping(data: { roomId?: string; conversationId?: string }) {
    const key = data.roomId || data.conversationId || 'default';
    
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key)!);
    }
    
    this.startTyping(data);
    
    const timeout = setTimeout(() => {
      this.stopTyping(data);
      this.typingTimeouts.delete(key);
    }, 2000);
    
    this.typingTimeouts.set(key, timeout);
  }

  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }

  isSocketAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getStatus() {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      pendingRoomJoins: this.pendingRoomJoins.length
    };
  }

  destroy() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
    
    if (this.socket) {
      this.socket.removeAllListeners();
    }
    
    this.disconnect();
    
    this.eventHandlers.clear();
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
    this.pendingRoomJoins = [];
  }
}

const socketService = new SocketService();

export default socketService;
export type { SocketEvents };
export { SocketService }; 