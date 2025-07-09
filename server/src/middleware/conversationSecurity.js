import { redisClient } from '../config/database.js';
import ModerationLog from '../models/ModerationLog.js';

const CONVERSATION_CACHE_TTL = 300;

export const validateConversationAccess = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();
    
    if (!conversationId || !conversationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID format'
      });
    }

    const cacheKey = `conversation:access:${conversationId}:${userId}`;
    let hasAccess = false;
    
    if (redisClient.isReady) {
      const cachedAccess = await redisClient.get(cacheKey);
      if (cachedAccess !== null) {
        hasAccess = cachedAccess === 'true';
        if (!hasAccess) {
          console.warn(`🚫 Cached conversation access denied: User ${userId} -> Conversation ${conversationId}`);
          return res.status(403).json({
            success: false,
            message: 'Access denied to this conversation'
          });
        }
      }
    }

    const Conversation = (await import('../models/Conversation.js')).default;
    const conversation = await Conversation.findById(conversationId).populate('participants', '_id username role');
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const participant = conversation.participants.find(p => p._id.toString() === userId);
    
    if (!participant && !hasAccess) {
      console.warn(`🚫 Unauthorized conversation access attempt: User ${userId} (${req.user.username}) tried to access conversation ${conversationId}`);
      
      await ModerationLog.create({
        userId: req.user._id,
        moderatorId: null,
        contentType: 'unauthorized_access',
        originalContent: `Attempted to access conversation ${conversationId}`,
        cleanedContent: '',
        violationType: 'privacy_violation',
        severity: 'medium',
        action: 'blocked',
        reason: 'Unauthorized conversation access attempt',
        flaggedWords: [],
        flaggedPatterns: ['unauthorized_access'],
        detectedItems: ['conversation_access'],
        isAutomated: true,
        metadata: {
          conversationId,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      if (redisClient.isReady) {
        await redisClient.setEx(cacheKey, CONVERSATION_CACHE_TTL, 'false');
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    if (redisClient.isReady && !hasAccess) {
      await redisClient.setEx(cacheKey, CONVERSATION_CACHE_TTL, 'true');
    }

    req.conversationData = {
      conversation,
      participant,
      isOwner: conversation.participants.length === 2 && conversation.participants[0]._id.toString() === userId
    };

    next();
  } catch (error) {
    console.error('Error validating conversation access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate conversation access'
    });
  }
};

export const detectConversationEnumeration = async (req, res, next) => {
  if (!redisClient.isReady) return next();
  
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;
    
    const enumerationKey = `conversation:enumeration:${userId}`;
    const currentAttempts = await redisClient.incr(enumerationKey);
    
    if (currentAttempts === 1) {
      await redisClient.expire(enumerationKey, 300);
    }
    
    const uniqueKey = `conversation:unique:${userId}`;
    await redisClient.sAdd(uniqueKey, conversationId);
    await redisClient.expire(uniqueKey, 300);
    
    const uniqueCount = await redisClient.sCard(uniqueKey);
    
    if (currentAttempts > 50 || uniqueCount > 20) {
      console.warn(`🚨 Conversation enumeration detected: User ${userId} - ${currentAttempts} attempts, ${uniqueCount} unique conversations`);
      
      await ModerationLog.create({
        userId: req.user._id,
        moderatorId: null,
        contentType: 'enumeration_attack',
        originalContent: `Conversation enumeration detected: ${currentAttempts} attempts, ${uniqueCount} unique`,
        cleanedContent: '',
        violationType: 'security_violation',
        severity: 'high',
        action: 'flagged',
        reason: 'Potential conversation enumeration attack',
        flaggedWords: [],
        flaggedPatterns: ['enumeration_attack'],
        detectedItems: ['conversation_enumeration'],
        isAutomated: true,
        metadata: {
          totalAttempts: currentAttempts,
          uniqueConversations: uniqueCount,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      
      return res.status(429).json({
        success: false,
        message: 'Too many conversation access attempts. Please wait before trying again.',
        retryAfter: 300
      });
    }
    
    next();
  } catch (error) {
    console.error('Error detecting conversation enumeration:', error);
    next();
  }
};

export const validateMessageAccess = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id.toString();
    
    if (!messageId || !messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }

    const Message = (await import('../models/Message.js')).default;
    const message = await Message.findById(messageId).populate('conversation sender');
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.messageType === 'direct') {
      if (!message.conversation) {
        return res.status(404).json({
          success: false,
          message: 'Message conversation not found'
        });
      }

      const isParticipant = message.conversation.participants.some(p => 
        p.toString() === userId
      );
      
      if (!isParticipant) {
        console.warn(`🚫 Unauthorized message access: User ${userId} tried to access message ${messageId} in conversation ${message.conversation._id}`);
        
        await ModerationLog.create({
          userId: req.user._id,
          moderatorId: null,
          contentType: 'unauthorized_access',
          originalContent: `Attempted to access message ${messageId} in conversation ${message.conversation._id}`,
          cleanedContent: '',
          violationType: 'privacy_violation',
          severity: 'medium',
          action: 'blocked',
          reason: 'Unauthorized message access attempt',
          flaggedWords: [],
          flaggedPatterns: ['unauthorized_access'],
          detectedItems: ['message_access'],
          isAutomated: true,
          metadata: {
            messageId,
            conversationId: message.conversation._id,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied to this message'
        });
      }
    }

    req.messageData = {
      message,
      isOwner: message.sender._id.toString() === userId
    };

    next();
  } catch (error) {
    console.error('Error validating message access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate message access'
    });
  }
};

export const sanitizeConversationResponse = (req, res, next) => {
  const originalSend = res.json;
  
  res.json = function(data) {
    if (data.success && data.conversation) {
      if (data.conversation.participants) {
        data.conversation.participants = data.conversation.participants
          .filter(participant => participant && participant._id && participant.username)
          .map(participant => ({
            _id: participant._id,
            username: participant.username,
          }));
      }
      if (data.conversation.archivedBy && req.user) {
        const userId = req.user._id.toString();
        const isParticipant = data.conversation.participants.some(p => p._id.toString() === userId);
        if (!isParticipant) {
          delete data.conversation.archivedBy;
        }
      }
    }
    
    if (data.success && data.conversations) {
      data.conversations = data.conversations.map(conversation => {
        if (conversation.participants) {
          conversation.participants = conversation.participants
            .filter(participant => participant && participant._id && participant.username)
            .map(participant => ({
              _id: participant._id,
              username: participant.username,
            }));
        }
        return conversation;
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

export const limitConversationCreation = async (req, res, next) => {
  if (!redisClient.isReady) return next();
  
  try {
    const userId = req.user._id.toString();
    const createKey = `conversation:create:${userId}`;
    
    const createCount = await redisClient.incr(createKey);
    
    if (createCount === 1) {
      await redisClient.expire(createKey, 3600);
    }
    
    if (createCount > 20) {
      console.warn(`🚫 Conversation creation limit exceeded: User ${userId}`);
      return res.status(429).json({
        success: false,
        message: 'Too many new conversations created. Please wait before starting another conversation.',
        retryAfter: 3600
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking conversation creation limit:', error);
    next();
  }
};

export default {
  validateConversationAccess,
  detectConversationEnumeration,
  validateMessageAccess,
  sanitizeConversationResponse,
  limitConversationCreation
}; 