import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import ChatRoom from '../models/ChatRoom.js';
import User from '../models/User.js';

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true
      }
    });

    this.connectedUsers = new Map();
    this.userRooms = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('authenticate', async (token) => {
        console.log('🔐 Server: Authentication attempt for socket:', socket.id);
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId);
          
          if (!user) {
            console.log('🔐 Server: Authentication failed - user not found');
            socket.emit('auth_error', 'Invalid user');
            return;
          }

          socket.userId = user._id.toString();
          socket.user = user;
          this.connectedUsers.set(socket.userId, socket.id);
          
          console.log('🔐 Server: User authenticated:', user.username, 'ID:', socket.userId);
          
          await this.joinUserRooms(socket);
          
          const onlineUsers = this.getOnlineUsers();
          socket.emit('online_users_list', { onlineUsers });
          console.log(`📊 Sent ${onlineUsers.length} online users to newly authenticated user`);
          
          this.broadcastUserStatus(socket.userId, 'online');
          
          socket.emit('authenticated', { userId: socket.userId, user });
        } catch (error) {
          console.log('🔐 Server: Authentication failed - token invalid:', error.message);
          socket.emit('auth_error', 'Authentication failed');
        }
      });

      socket.on('join_room', async (roomId) => {
        console.log('🏠 Server: User', socket.userId, 'attempting to join room:', roomId);
        
        if (!socket.userId) {
          console.log('🏠 Server: User not authenticated, cannot join room');
          return;
        }
        
        try {
          const mongoose = (await import('mongoose')).default;
          const userId = new mongoose.Types.ObjectId(socket.userId);
          
          let room = await ChatRoom.findById(roomId);
          let isConversation = false;
          
          if (!room) {
            room = await Conversation.findById(roomId);
            isConversation = true;
          }
          
          if (!room) {
            console.log('🏠 Server: Room/conversation not found:', roomId);
            return;
          }

          if (isConversation) {
            const isParticipant = room.participants.some(p => p.toString() === socket.userId);
            if (!isParticipant) {
              console.log('🏠 Server: User not a participant in conversation:', roomId);
              socket.emit('room_error', 'Not a participant in this conversation');
              return;
            }
            
            socket.join(roomId);
            console.log('🏠 Server: User', socket.userId, 'joined conversation:', roomId);
            
          } else {
            if (!await this.canUserJoinRoom(socket.userId, room)) {
              console.log('🏠 Server: User cannot join room due to permissions');
              socket.emit('room_error', 'Cannot join this room');
              return;
            }

            socket.join(roomId);
            console.log('🏠 Server: User', socket.userId, 'joined room:', roomId);
            
            const isParticipant = room.participants.some(p => p.user.toString() === socket.userId);
            if (!isParticipant) {
              room.participants.push({
                user: userId,
                joinedAt: new Date(),
                lastActivity: new Date(),
                messageCount: 0,
                status: 'active'
              });
              await room.save();
              console.log('🏠 Server: Added user to room participants');
            }
          }

          if (!this.userRooms.has(socket.userId)) {
            this.userRooms.set(socket.userId, new Set());
          }
          this.userRooms.get(socket.userId).add(roomId);

          const currentRoom = this.io.sockets.adapter.rooms.get(roomId);
          const roomSize = currentRoom ? currentRoom.size : 0;
          console.log('🏠 Server: Room', roomId, 'now has', roomSize, 'connected users');

          socket.emit('room_joined', { roomId, room, isConversation });
          
          if (!isConversation) {
            socket.to(roomId).emit('user_joined_room', {
              userId: socket.userId,
              user: socket.user,
              roomId
            });
            
            this.broadcastRoomUserCount(roomId);
          }
        } catch (error) {
          console.error('🏠 Server: Error joining room:', error);
          socket.emit('room_error', 'Failed to join room');
        }
      });

      socket.on('leave_room', async (roomId) => {
        if (!socket.userId) return;
        
        socket.leave(roomId);
        
        if (this.userRooms.has(socket.userId)) {
          this.userRooms.get(socket.userId).delete(roomId);
        }

        socket.to(roomId).emit('user_left_room', {
          userId: socket.userId,
          user: socket.user,
          roomId
        });
        
        this.broadcastRoomUserCount(roomId);
      });

      socket.on('send_message', async (data) => {
        if (!socket.userId) return;
        
        try {
          const message = new Message({
            sender: socket.userId,
            content: data.content,
            type: data.type || 'direct',
            conversationId: data.conversationId,
            roomId: data.roomId,
            replyTo: data.replyTo,
            attachments: data.attachments || []
          });

          await message.save();
          await message.populate('sender', 'username avatar');
          
          if (data.replyTo) {
            await message.populate('replyTo');
          }

          if (data.type === 'global' && data.roomId) {
            this.io.to(data.roomId).emit('new_message', message);
          } else if (data.conversationId) {
            const conversation = await Conversation.findById(data.conversationId);
            if (conversation) {
              conversation.lastMessage = message._id;
              conversation.lastActivity = new Date();
              await conversation.save();

              for (const participantId of conversation.participants) {
                const participantSocketId = this.connectedUsers.get(participantId.toString());
                if (participantSocketId) {
                  this.io.to(participantSocketId).emit('new_message', message);
                }
              }
            }
          }

          socket.emit('message_sent', { messageId: message._id });
        } catch (error) {
          socket.emit('message_error', 'Failed to send message');
        }
      });

      socket.on('mark_read', async (data) => {
        if (!socket.userId) return;
        
        try {
          const message = await Message.findById(data.messageId);
          if (message && !message.readBy.includes(socket.userId)) {
            message.readBy.push(socket.userId);
            message.readAt = new Date();
            await message.save();

            const senderSocketId = this.connectedUsers.get(message.sender.toString());
            if (senderSocketId) {
              this.io.to(senderSocketId).emit('message_read', {
                messageId: message._id,
                readBy: socket.userId,
                readAt: message.readAt
              });
            }
          }
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });

      socket.on('typing_start', (data) => {
        if (!socket.userId) return;
        
        if (data.roomId) {
          socket.to(data.roomId).emit('user_typing', {
            userId: socket.userId,
            user: socket.user,
            roomId: data.roomId
          });
        } else if (data.conversationId) {
          socket.to(data.conversationId).emit('user_typing', {
            userId: socket.userId,
            user: socket.user,
            conversationId: data.conversationId
          });
        }
      });

      socket.on('typing_stop', (data) => {
        if (!socket.userId) return;
        
        if (data.roomId) {
          socket.to(data.roomId).emit('user_stop_typing', {
            userId: socket.userId,
            roomId: data.roomId
          });
        } else if (data.conversationId) {
          socket.to(data.conversationId).emit('user_stop_typing', {
            userId: socket.userId,
            conversationId: data.conversationId
          });
        }
      });

      socket.on('request_online_users', () => {
        if (!socket.userId) return;
        
        const onlineUsers = this.getOnlineUsers();
        socket.emit('online_users_list', { onlineUsers });
      });

      socket.on('request_room_user_count', (roomId) => {
        if (!socket.userId || !roomId) return;
        
        const room = this.io.sockets.adapter.rooms.get(roomId);
        const userCount = room ? room.size : 0;
        
        socket.emit('room_user_count', {
          roomId,
          userCount
        });
      });

      socket.on('disconnect', () => {
        console.log('🚪 Server: User disconnected:', socket.id, 'UserId:', socket.userId);
        
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.userRooms.delete(socket.userId);
          this.broadcastUserStatus(socket.userId, 'offline');
        }
      });
    });
  }

  async joinUserRooms(socket) {
    try {
      const mongoose = (await import('mongoose')).default;
      const userId = new mongoose.Types.ObjectId(socket.userId);
      
      const conversations = await Conversation.find({
        participants: { $in: [userId] }
      });

      console.log(`🏠 Server: Found ${conversations.length} conversations for user`);
      for (const conversation of conversations) {
        socket.join(conversation._id.toString());
        console.log(`🏠 Server: Joined conversation room: ${conversation._id}`);
      }

      const rooms = await ChatRoom.find({
        participants: { $in: [userId] }
      });

      console.log(`🏠 Server: Found ${rooms.length} chat rooms for user`);
      for (const room of rooms) {
        socket.join(room._id.toString());
        console.log(`🏠 Server: Joined chat room: ${room._id}`);
        
        if (!this.userRooms.has(socket.userId)) {
          this.userRooms.set(socket.userId, new Set());
        }
        this.userRooms.get(socket.userId).add(room._id.toString());
      }
    } catch (error) {
      console.error('Error joining user rooms:', error);
    }
  }

  async canUserJoinRoom(userId, room) {
    if (room.type === 'private' && !room.participants.includes(userId)) {
      return false;
    }

    if (room.bannedUsers.includes(userId)) {
      return false;
    }

    if (room.settings.minLevel) {
      const user = await User.findById(userId);
      if (user.level < room.settings.minLevel) {
        return false;
      }
    }

    return true;
  }

  broadcastUserStatus(userId, status) {
    console.log(`📡 Broadcasting user status: ${userId} is now ${status}`);
    
    this.io.emit('user_status_changed', { userId, status });
    
    const userRooms = this.userRooms.get(userId);
    if (userRooms) {
      userRooms.forEach(roomId => {
        this.io.to(roomId).emit('user_status_changed', { userId, status, roomId });
      });
    }
    
    console.log(`📡 Status broadcast complete for user ${userId}`);
  }

  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  broadcastRoomUserCount(roomId) {
    try {
      const room = this.io.sockets.adapter.rooms.get(roomId);
      const userCount = room ? room.size : 0;
      
      console.log(`📊 Broadcasting room ${roomId} user count: ${userCount}`);
      
      this.io.to(roomId).emit('room_user_count', {
        roomId,
        userCount
      });
    } catch (error) {
      console.error('Error broadcasting room user count:', error);
    }
  }
}

export default SocketService; 