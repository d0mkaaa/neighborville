import express from 'express';
import { auth } from '../middleware/auth.js';
import Message from '../models/Message.js';
import ChatRoom from '../models/ChatRoom.js';
import ModerationService from '../services/moderationService.js';

const router = express.Router();

let socketService = null;

const getSocketService = () => {
  return socketService;
};

export const setSocketService = (service) => {
  socketService = service;
};

router.get('/channels/global', auth, async (req, res) => {
  try {
    let globalRoom = await ChatRoom.findOne({ roomType: 'global' });
    
    if (!globalRoom) {
      globalRoom = new ChatRoom({
        name: 'Global Chat',
        description: 'Community-wide chat for all players',
        roomType: 'global',
        settings: {
          isPublic: true,
          maxParticipants: 1000,
          allowImages: true,
          allowLinks: false,
          profanityFilter: true
        }
      });
      await globalRoom.save();
    }

    res.json({
      success: true,
      channel: globalRoom
    });
  } catch (error) {
    console.error('Error fetching global channel:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch global channel' });
  }
});

router.get('/channels/:channelId/messages', auth, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const channel = await ChatRoom.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    const messages = await Message.find({
      chatRoom: channelId,
      messageType: 'global'
    })
    .populate('sender', 'username gameData.level')
    .populate({
      path: 'replyTo',
      populate: { path: 'sender', select: 'username' }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      messages: messages.reverse(),
      channel: {
        name: channel.name,
        description: channel.description,
        participantCount: channel.participants?.length || 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch channel messages' });
  }
});

router.get('/channels/:channelId/participants', auth, async (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = await ChatRoom.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    const socketService = global.socketService;
    let onlineCount = 0;
    
    if (socketService && channel.roomType === 'global') {
      const onlineUserIds = socketService.getOnlineUsers();
      onlineCount = onlineUserIds.length;
    } else if (socketService && channel.participants) {
      const onlineUserIds = new Set(socketService.getOnlineUsers());
      onlineCount = channel.participants.filter(p => 
        onlineUserIds.has(p.user?.toString())
      ).length;
    }

    res.json({
      success: true,
      participantCount: channel.participants?.length || 0,
      onlineCount,
      channel: {
        id: channel._id,
        name: channel.name,
        roomType: channel.roomType
      }
    });
  } catch (error) {
    console.error('Error fetching channel participants:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch channel participants' });
  }
});

router.post('/channels/:channelId/messages', auth,
  checkMessageRateLimit,
  validateMessageContent,
  enhancedContentModeration,
  detectMessageFlooding,
  logMessageAttempt,
  async (req, res) => {
  try {
    const { channelId } = req.params;
    const { replyTo } = req.body;
    const userId = req.user._id;

    const { content: validatedContent } = req.validatedContent;
    const moderationResult = req.moderationResult;

    console.log('Sending global message:', { channelId, content: validatedContent, userId, replyTo });

    const channel = await ChatRoom.findById(channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    if (channel.isUserBanned(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are banned from this channel' 
      });
    }

    if (channel.isUserMuted(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are muted in this channel' 
      });
    }

    const finalContent = moderationResult.cleanedText || validatedContent;

    const messageData = {
      content: finalContent,
      sender: userId,
      messageType: 'global',
      chatRoom: channelId,
      metadata: {
        edited: false,
        editedAt: null,
        wasModerated: !!moderationResult.cleanedText
      }
    };

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    console.log('Creating message with data:', messageData);

    const message = new Message(messageData);
    await message.save();

    console.log('Message saved, populating...');

    await message.populate('sender', 'username gameData.level');
    if (replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username' }
      });
    }

    console.log('Message populated, sending socket event...');

    const socketService = getSocketService();
    if (socketService && socketService.io) {
      const connectedSockets = socketService.io.sockets.sockets.size;
      console.log(`Total connected sockets: ${connectedSockets}`);
      
      const room = socketService.io.sockets.adapter.rooms.get(channelId.toString());
      const roomSize = room ? room.size : 0;
      console.log(`Room ${channelId.toString()} has ${roomSize} connected users`);
      
      socketService.io.to(channelId.toString()).emit('message:new', message);
      console.log('Socket event sent to room:', channelId.toString(), 'with message:', {
        _id: message._id,
        content: message.content,
        sender: message.sender.username,
        messageType: message.messageType
      });
      
      socketService.io.emit('global:message:new', message);
      console.log('Global broadcast sent to all connected sockets');
    } else {
      console.warn('Socket service not available');
    }

    console.log('Sending response...');

    res.status(201).json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Error sending channel message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

router.put('/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Can only edit your own messages' });
    }

    const moderationResult = ModerationService.moderateContent(content.trim(), 'chat_message');
    
    if (!moderationResult.isValid) {
      console.log('🚫 Edited message blocked by moderation:', moderationResult);
      
      await ModerationService.logModerationAction(
        userId,
        content.trim(),
        'chat_message',
        moderationResult
      );
      
      return res.status(400).json({
        success: false,
        message: 'Edited message contains inappropriate content',
        moderation: {
          reason: moderationResult.reason,
          severity: moderationResult.severity,
          violationType: moderationResult.violationType,
          cleanedText: moderationResult.cleanedText,
          flaggedWords: moderationResult.flaggedWords || [],
          flaggedPatterns: moderationResult.flaggedPatterns || []
        }
      });
    }

    const finalContent = moderationResult.cleanedText || content.trim();

    message.content = finalContent;
    
    if (!message.metadata) {
      message.metadata = {};
    }
    
    message.metadata.edited = true;
    message.metadata.editedAt = new Date();
    message.metadata.wasModerated = !!moderationResult.cleanedText;
    await message.save();

    await message.populate('sender', 'username gameData.level');

    const socketService = getSocketService();
    if (socketService && socketService.io) {
      socketService.io.to(message.chatRoom.toString()).emit('message:edited', message);
    }

    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
});

router.delete('/messages/:messageId', auth, async (req, res) => {
  try {
    console.log('🗑️ Server: DELETE request received for message:', req.params.messageId);
    console.log('🗑️ Server: User ID:', req.user._id);
    
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      console.log('🗑️ Server: Message not found:', messageId);
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    console.log('🗑️ Server: Message found, checking permissions...');
    console.log('🗑️ Server: Message sender:', message.sender.toString());
    console.log('🗑️ Server: Current user:', userId.toString());

    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';
    if (message.sender.toString() !== userId.toString() && !isAdmin) {
      console.log('🗑️ Server: Permission denied - not owner or admin');
      return res.status(403).json({ success: false, message: 'Can only delete your own messages' });
    }

    console.log('🗑️ Server: Permission granted, deleting message...');
    await Message.findByIdAndDelete(messageId);

    const socketService = getSocketService();
    if (socketService && socketService.io) {
      const deleteData = { messageId, channelId: message.chatRoom };
      
      const room = socketService.io.sockets.adapter.rooms.get(message.chatRoom.toString());
      const roomSize = room ? room.size : 0;
      
      console.log(`🗑️ Server: Message deleted and broadcasting to ${roomSize} users in room ${message.chatRoom.toString()}`);
      
      socketService.io.to(message.chatRoom.toString()).emit('message:deleted', deleteData);
      socketService.io.emit('global:message:deleted', deleteData);
    }

    console.log('🗑️ Server: Sending success response to client');
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
});

router.get('/users/search', auth, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const User = (await import('../models/User.js')).default;
    const users = await User.find({
      username: new RegExp(query.trim(), 'i'),
      _id: { $ne: req.user._id }
    })
    .select('username gameData.level')
    .limit(parseInt(limit))
    .exec();

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
});

import { 
  checkModerationRateLimit, 
  validateModerationAction, 
  logModerationAttempt,
  detectSuspiciousModerationPatterns 
} from '../middleware/moderationSecurity.js';
import {
  checkMessageRateLimit,
  validateMessageContent,
  enhancedContentModeration,
  detectMessageFlooding,
  logMessageAttempt
} from '../middleware/messageSecurity.js';
import {
  validateConversationAccess,
  detectConversationEnumeration,
  validateMessageAccess,
  sanitizeConversationResponse,
  limitConversationCreation
} from '../middleware/conversationSecurity.js';
import { auditMiddleware, AUDIT_EVENTS } from '../middleware/auditLogger.js';

router.post('/rooms/:roomId/moderate', auth, 
  checkModerationRateLimit,
  validateModerationAction,
  detectSuspiciousModerationPatterns,
  logModerationAttempt,
  auditMiddleware(AUDIT_EVENTS.USER_MODERATED, {
    getTargetUserId: (req) => req.body.userId,
    getDescription: (req, data, success) => 
      `${success ? 'Successfully' : 'Failed to'} ${req.body.action} user ${req.moderationData?.targetUser?.username || req.body.userId} in room ${req.params.roomId}`,
    logBody: false
  }),
  async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, action, duration } = req.body;
    const moderatorId = req.user._id;

    console.log(`🛡️ Server: Moderation request - Room: ${roomId}, User: ${userId}, Action: ${action}, Duration: ${duration}`);

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';
    const isModerator = room.isUserModerator(moderatorId);
    
    if (!isAdmin && !isModerator) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions to moderate users in this room' });
    }

    const { targetUser, validatedAction, validatedDuration } = req.moderationData;

    let responseMessage = '';
    const finalDuration = validatedDuration;
    const durationMs = finalDuration ? finalDuration * 1000 : 0;

    switch (validatedAction) {
      case 'timeout':
        await room.muteUser(userId, moderatorId, `Timed out by ${req.user.username}`, durationMs || 300000);
        responseMessage = `User ${targetUser.username} has been timed out for ${finalDuration || 300} seconds`;
        break;

      case 'mute':
        await room.muteUser(userId, moderatorId, `Muted by ${req.user.username}`, durationMs || 600000);
        responseMessage = `User ${targetUser.username} has been muted for ${finalDuration || 600} seconds`;
        break;

      case 'kick':
        room.removeParticipant(userId);
        await room.save();
        responseMessage = `User ${targetUser.username} has been kicked from the room`;
        const socketService = getSocketService();
        if (socketService && socketService.io) {
          const userSocketId = socketService.connectedUsers.get(userId);
          if (userSocketId) {
            const userSocket = socketService.io.sockets.sockets.get(userSocketId);
            if (userSocket) {
              userSocket.leave(roomId);
              userSocket.emit('kicked_from_room', {
                roomId,
                reason: `Kicked by ${req.user.username}`,
                moderator: req.user.username
              });
            }
          }
        }
        break;

      case 'ban':
        await room.banUser(userId, moderatorId, `Banned by ${req.user.username}`, durationMs);
        responseMessage = `User ${targetUser.username} has been banned from the room${finalDuration ? ` for ${finalDuration} seconds` : ' permanently'}`;
        const socketServiceForBan = getSocketService();
        if (socketServiceForBan && socketServiceForBan.io) {
          const userSocketId = socketServiceForBan.connectedUsers.get(userId);
          if (userSocketId) {
            const userSocket = socketServiceForBan.io.sockets.sockets.get(userSocketId);
            if (userSocket) {
              userSocket.leave(roomId);
              userSocket.emit('banned_from_room', {
                roomId,
                reason: `Banned by ${req.user.username}`,
                duration: finalDuration,
                moderator: req.user.username,
                expiresAt: finalDuration ? new Date(Date.now() + durationMs) : null
              });
            }
          }
        }
        break;
    }

    const ModerationService = (await import('../services/moderationService.js')).default;
    const moderationResult = {
      reason: `Chat moderation: ${validatedAction} applied to user ${targetUser.username} by ${req.user.username}`,
      severity: validatedAction === 'ban' ? 'high' : validatedAction === 'kick' ? 'medium' : 'low',
      violationType: 'moderation_action',
      detectedItems: [validatedAction],
      cleanedText: responseMessage,
      moderatorInfo: {
        moderatorId: moderatorId.toString(),
        moderatorUsername: req.user.username,
        moderatorRole: req.user.role
      },
      targetInfo: {
        targetUserId: userId,
        targetUsername: targetUser.username,
        targetRole: targetUser.role
      },
      roomInfo: {
        roomId,
        roomName: room.name
      }
    };

    await ModerationService.logModerationAction(
      userId,
      responseMessage,
      'moderation_action',
      moderationResult,
      moderatorId
    );

    const socketService = getSocketService();
    if (socketService && socketService.io) {
      socketService.io.to(roomId).emit('user_moderated', {
        userId,
        username: targetUser.username,
        action: validatedAction,
        duration: finalDuration,
        moderator: req.user.username,
        moderatorRole: req.user.role,
        reason: responseMessage,
        timestamp: new Date(),
        expiresAt: finalDuration ? new Date(Date.now() + durationMs) : null
      });
    }

    console.log(`✅ Server: Moderation applied successfully - ${responseMessage}`);

    res.json({
      success: true,
      message: responseMessage
    });
  } catch (error) {
    console.error('Error applying moderation action:', error);
    res.status(500).json({ success: false, message: 'Failed to apply moderation action' });
  }
});

router.post('/messages/:messageId/report', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason } = req.body;
    const reporterId = req.user._id;

    console.log(`🚨 Server: Message report - Message: ${messageId}, Reason: ${reason}, Reporter: ${reporterId}`);

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Report reason must be at least 10 characters' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() === reporterId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot report your own message' });
    }

    const Report = (await import('../models/Report.js')).default;
    const report = new Report({
      reporterId,
      reportedUserId: message.sender,
      contentType: 'chat_message',
      contentId: messageId,
      reason: reason.trim(),
      originalContent: message.content,
      status: 'pending'
    });

    await report.save();

    console.log(`✅ Server: Message report created with ID: ${report._id}`);

    res.json({
      success: true,
      message: 'Message reported successfully. Our moderation team will review it shortly.'
    });
  } catch (error) {
    console.error('Error reporting message:', error);
    res.status(500).json({ success: false, message: 'Failed to report message' });
  }
});

router.post('/conversations/:conversationId/archive', auth,
  detectConversationEnumeration,
  validateConversationAccess,
  async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    console.log(`📁 Server: Archive conversation - Conversation: ${conversationId}, User: ${userId}`);

    const { conversation } = req.conversationData;

    if (!conversation.archivedBy) {
      conversation.archivedBy = [];
    }

    if (!conversation.archivedBy.includes(userId)) {
      conversation.archivedBy.push(userId);
      await conversation.save();
    }

    console.log(`✅ Server: Conversation archived for user ${userId}`);

    res.json({
      success: true,
      message: 'Conversation archived successfully'
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to archive conversation' });
  }
});

router.get('/conversations', auth, sanitizeConversationResponse, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    console.log(`💬 Server: Getting conversations for user ${userId}`);

    const Conversation = (await import('../models/Conversation.js')).default;
    const mongoose = (await import('mongoose')).default;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const conversations = await Conversation.find({
      participants: { $in: [userObjectId] },
      conversationType: 'direct'
    })
    .populate('participants', 'username gameData.level')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'username' }
    })
    .sort({ updatedAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    console.log(`✅ Server: Found ${conversations.length} conversations`);

    res.json({
      success: true,
      conversations: conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: conversations.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

router.post('/conversations', auth, limitConversationCreation, sanitizeConversationResponse, async (req, res) => {
  try {
    const { recipientUsername } = req.body;
    const userId = req.user._id;

    console.log(`💬 Server: Creating conversation between user ${userId} and ${recipientUsername}`);

    if (!recipientUsername) {
      return res.status(400).json({ success: false, message: 'Recipient username is required' });
    }

    const User = (await import('../models/User.js')).default;
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (recipient._id.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create conversation with yourself' });
    }

    const Conversation = (await import('../models/Conversation.js')).default;

    const existingConversation = await Conversation.findOne({
      conversationType: 'direct',
      participants: { $all: [userId, recipient._id], $size: 2 }
    })
    .populate('participants', 'username gameData.level')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'username' }
    });

    if (existingConversation) {
      console.log(`✅ Server: Returning existing conversation ${existingConversation._id}`);
      return res.json({
        success: true,
        conversation: existingConversation
      });
    }

    const conversation = new Conversation({
      participants: [userId, recipient._id],
      conversationType: 'direct'
    });

    await conversation.save();
    await conversation.populate('participants', 'username gameData.level');

    console.log(`✅ Server: Created new conversation ${conversation._id}`);

    const socketService = getSocketService();
    if (socketService && socketService.io) {
      conversation.participants.forEach(participant => {
        const participantSocketId = socketService.connectedUsers.get(participant._id.toString());
        if (participantSocketId) {
          const participantSocket = socketService.io.sockets.sockets.get(participantSocketId);
          if (participantSocket) {
            participantSocket.join(conversation._id.toString());
            console.log(`💬 Server: Added user ${participant.username} to conversation room ${conversation._id}`);
          }
        }
      });

      conversation.participants.forEach(participant => {
        const participantSocketId = socketService.connectedUsers.get(participant._id.toString());
        if (participantSocketId) {
          socketService.io.to(participantSocketId).emit('conversation:new', conversation);
          console.log(`💬 Server: Notified user ${participant.username} about new conversation`);
        }
      });
    }

    res.status(201).json({
      success: true,
      conversation: conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
});

router.get('/conversations/:conversationId/messages', auth, 
  detectConversationEnumeration,
  validateConversationAccess,
  async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    console.log(`💬 Server: Getting messages for conversation ${conversationId}, user ${userId}`);

    const { conversation } = req.conversationData;

    const messages = await Message.find({
      conversation: conversationId,
      messageType: 'direct'
    })
    .populate('sender', 'username gameData.level')
    .populate({
      path: 'replyTo',
      populate: { path: 'sender', select: 'username' }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    console.log(`✅ Server: Found ${messages.length} messages in conversation`);

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversation messages' });
  }
});

router.post('/conversations/:conversationId/messages', auth,
  detectConversationEnumeration,
  validateConversationAccess,
  checkMessageRateLimit,
  validateMessageContent,
  enhancedContentModeration,
  detectMessageFlooding,
  logMessageAttempt,
  async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { replyTo } = req.body;
    const userId = req.user._id;

    const { content: validatedContent } = req.validatedContent;
    const moderationResult = req.moderationResult;

    console.log(`💬 Server: Sending message to conversation ${conversationId} from user ${userId}`);

    const { conversation } = req.conversationData;

    const finalContent = moderationResult.cleanedText || validatedContent;

    const messageData = {
      content: finalContent,
      sender: userId,
      messageType: 'direct',
      conversation: conversationId,
      metadata: {
        edited: false,
        editedAt: null,
        wasModerated: !!moderationResult.cleanedText
      }
    };

    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    const message = new Message(messageData);
    await message.save();

    await message.populate('sender', 'username gameData.level');
    if (replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username' }
      });
    }

    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    const socketService = getSocketService();
    if (socketService && socketService.io) {
      socketService.io.to(conversationId.toString()).emit('message:new', message);
      console.log(`💬 Server: Message sent to conversation room ${conversationId}`);
    }

    console.log(`✅ Server: DM message sent successfully`);

    res.status(201).json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Error sending conversation message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

export default router; 