import { redisClient } from '../config/database.js';
import ModerationService from '../services/moderationService.js';
import Message from '../models/Message.js';
import crypto from 'crypto';

const MESSAGE_RATE_LIMITS = {
  global: { count: 20, window: 60 },
  direct: { count: 50, window: 60 },
  burst: { count: 5, window: 10 },
  newUser: { count: 10, window: 60 },
  suspicious: { count: 5, window: 300 }
};

const CONTENT_RULES = {
  minLength: 1,
  maxLength: 2000,
  maxUrls: 3,
  maxMentions: 10,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxFileSize: 10 * 1024 * 1024
};

const SPAM_PATTERNS = [
  /(.)\1{10,}/g,
  /(.{1,3})\1{5,}/g,
  /(https?:\/\/[^\s]+){4,}/g,
  /[A-Z]{20,}/g,
  /(.{1,10})\1{10,}/g
];

export const checkMessageRateLimit = async (req, res, next) => {
  if (!redisClient.isReady) return next();
  
  const userId = req.user._id.toString();
  const messageType = req.body.messageType || 'global';
  const isNewUser = (new Date() - req.user.createdAt) < (7 * 24 * 60 * 60 * 1000);
  
  try {
    const suspiciousKey = `user:suspicious:${userId}`;
    const isSuspicious = await redisClient.get(suspiciousKey);
    
    let rateLimit;
    if (isSuspicious) {
      rateLimit = MESSAGE_RATE_LIMITS.suspicious;
    } else if (isNewUser) {
      rateLimit = MESSAGE_RATE_LIMITS.newUser;
    } else {
      rateLimit = MESSAGE_RATE_LIMITS[messageType] || MESSAGE_RATE_LIMITS.global;
    }
    
    const mainKey = `message:${messageType}:${userId}`;
    const mainCount = await redisClient.incr(mainKey);
    
    if (mainCount === 1) {
      await redisClient.expire(mainKey, rateLimit.window);
    }
    
    if (mainCount > rateLimit.count) {
      console.warn(`🚫 Message rate limit exceeded: ${userId} (${messageType})`);
      
      if (global.socketService) {
        const waitTime = Math.ceil(rateLimit.window / 60);
        global.socketService.sendNotificationToUser(userId, {
          type: 'warning',
          title: 'Message Limit Reached',
          message: `You've sent too many messages. Please wait ${waitTime} minute(s) before sending more.`,
          duration: 8000
        });
      }
      
      return res.status(429).json({
        success: false,
        message: 'You are sending messages too quickly. Please slow down.',
        retryAfter: rateLimit.window,
        messageType
      });
    }
    
    const burstKey = `message:burst:${userId}`;
    const burstCount = await redisClient.incr(burstKey);
    
    if (burstCount === 1) {
      await redisClient.expire(burstKey, MESSAGE_RATE_LIMITS.burst.window);
    }
    
    if (burstCount > MESSAGE_RATE_LIMITS.burst.count) {
      console.warn(`🚫 Message burst limit exceeded: ${userId}`);
      
      if (global.socketService) {
        global.socketService.sendNotificationToUser(userId, {
          type: 'warning',
          title: 'Slow Down!',
          message: 'You\'re typing too fast! Please wait a moment before sending another message.',
          duration: 6000
        });
      }
      
      return res.status(429).json({
        success: false,
        message: 'Please wait a moment before sending another message.',
        retryAfter: MESSAGE_RATE_LIMITS.burst.window,
        rateLimitType: 'burst'
      });
    }
    
    req.messageRateLimit = {
      mainCount,
      burstCount,
      isNewUser,
      isSuspicious: !!isSuspicious,
      limitUsed: rateLimit
    };
    
    next();
  } catch (error) {
    console.error('Error checking message rate limit:', error);
    next();
  }
};

export const validateMessageContent = async (req, res, next) => {
  try {
    const { content, attachments } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required and must be text'
      });
    }
    
    const trimmedContent = content.trim();

    if (trimmedContent.length < CONTENT_RULES.minLength) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }
    
    if (trimmedContent.length > CONTENT_RULES.maxLength) {
      if (global.socketService) {
        const excess = trimmedContent.length - CONTENT_RULES.maxLength;
        global.socketService.sendNotificationToUser(req.user._id, {
          type: 'warning',
          title: 'Message Too Long',
          message: `Your message is ${excess} characters too long. Please shorten it to ${CONTENT_RULES.maxLength} characters or less.`,
          duration: 6000
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Message too long. Maximum ${CONTENT_RULES.maxLength} characters allowed.`,
        maxLength: CONTENT_RULES.maxLength,
        currentLength: trimmedContent.length
      });
    }
    
          for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(trimmedContent)) {
        console.warn(`🚫 Spam pattern detected in message from ${req.user._id}: ${pattern}`);
        
        if (global.socketService) {
          global.socketService.sendNotificationToUser(req.user._id, {
            type: 'warning',
            title: 'Spam Detected',
            message: 'Your message looks like spam. Please send normal, conversational messages.',
            duration: 7000
          });
        }
        
        return res.status(400).json({
          success: false,
          message: 'Message appears to be spam. Please send normal messages.',
          spamType: 'pattern_detected'
        });
      }
    }
    
    const urlMatches = trimmedContent.match(/https?:\/\/[^\s]+/g) || [];
    const mentionMatches = trimmedContent.match(/@\w+/g) || [];
    
    if (urlMatches.length > CONTENT_RULES.maxUrls) {
      if (global.socketService) {
        global.socketService.sendNotificationToUser(req.user._id, {
          type: 'warning',
          title: 'Too Many Links',
          message: `You can only include ${CONTENT_RULES.maxUrls} link(s) per message, but you have ${urlMatches.length}. Please remove some links.`,
          duration: 7000
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Too many URLs. Maximum ${CONTENT_RULES.maxUrls} allowed.`,
        maxUrls: CONTENT_RULES.maxUrls,
        foundUrls: urlMatches.length
      });
    }
    
    if (mentionMatches.length > CONTENT_RULES.maxMentions) {
      if (global.socketService) {
        global.socketService.sendNotificationToUser(req.user._id, {
          type: 'warning',
          title: 'Too Many Mentions',
          message: `You can only mention ${CONTENT_RULES.maxMentions} people per message, but you have ${mentionMatches.length}. Please reduce the number of @mentions.`,
          duration: 7000
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Too many mentions. Maximum ${CONTENT_RULES.maxMentions} allowed.`,
        maxMentions: CONTENT_RULES.maxMentions,
        foundMentions: mentionMatches.length
      });
    }
    
    if (attachments && Array.isArray(attachments)) {
      for (const attachment of attachments) {
        if (!CONTENT_RULES.allowedFileTypes.includes(attachment.mimeType)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only images are allowed.',
            allowedTypes: CONTENT_RULES.allowedFileTypes
          });
        }
        
        if (attachment.size > CONTENT_RULES.maxFileSize) {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum 10MB allowed.',
            maxSize: CONTENT_RULES.maxFileSize,
            fileSize: attachment.size
          });
        }
      }
    }
    
    req.validatedContent = {
      content: trimmedContent,
      urlCount: urlMatches.length,
      mentionCount: mentionMatches.length,
      attachments: attachments || []
    };
    
    next();
  } catch (error) {
    console.error('Error validating message content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate message content'
    });
  }
};

export const enhancedContentModeration = async (req, res, next) => {
  try {
    const { content } = req.validatedContent;
    const userId = req.user._id;
    
    const moderationResult = ModerationService.moderateContent(content, 'chat_message');
    
    if (!moderationResult.isValid) {
      console.log('🚫 Message blocked by content moderation:', moderationResult);
      
      if (moderationResult.severity === 'high' || moderationResult.severity === 'critical') {
        const suspiciousKey = `user:suspicious:${userId}`;
        await redisClient.setEx(suspiciousKey, 3600, 'true');
      }
      
      await ModerationService.logModerationAction(
        userId,
        content,
        'chat_message',
        {
          ...moderationResult,
          messageType: req.body.messageType,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          rateLimit: req.messageRateLimit
        }
      );
      
      if (global.socketService) {
        let notificationTitle = 'Message Blocked';
        let notificationMessage = 'Your message contains inappropriate content and was blocked.';
        let duration = 8000;
        
        switch (moderationResult.violationType) {
          case 'profanity':
          case 'hate_speech':
            notificationTitle = 'Inappropriate Language';
            notificationMessage = moderationResult.cleanedText 
              ? `Your message contained inappropriate language. Try this instead: "${moderationResult.cleanedText}"`
              : 'Your message contained inappropriate language. Please rephrase without offensive words.';
            duration = 10000;
            break;
          case 'spam':
            notificationTitle = 'Spam Detected';
            notificationMessage = 'Your message was flagged as spam. Please send normal, conversational messages.';
            duration = 7000;
            break;
          case 'personal_info':
            notificationTitle = 'Personal Information Detected';
            notificationMessage = 'For your safety, avoid sharing personal details like phone numbers or addresses in chat.';
            duration = 9000;
            break;
          case 'sexual_content':
            notificationTitle = 'Inappropriate Content';
            notificationMessage = 'Your message contains inappropriate content. Please keep conversations family-friendly.';
            duration = 8000;
            break;
          case 'threats':
            notificationTitle = 'Threatening Content';
            notificationMessage = 'Your message contains threatening language. Please be respectful in your communications.';
            duration = 10000;
            break;
          default:
            if (moderationResult.cleanedText) {
              notificationMessage = `Your message was blocked. Suggested edit: "${moderationResult.cleanedText}"`;
              duration = 9000;
            }
        }
        
        global.socketService.sendNotificationToUser(userId, {
          type: 'error',
          title: notificationTitle,
          message: notificationMessage,
          duration: duration
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Message contains inappropriate content and has been blocked.',
        moderation: {
          reason: moderationResult.reason,
          severity: moderationResult.severity,
          violationType: moderationResult.violationType,
          cleanedText: moderationResult.cleanedText,
          suggestionsEnabled: !!moderationResult.cleanedText
        }
      });
    }
    
    req.moderationResult = moderationResult;
    
    next();
  } catch (error) {
    console.error('Error in enhanced content moderation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate message content'
    });
  }
};

export const detectMessageFlooding = async (req, res, next) => {
  if (!redisClient.isReady) return next();
  
  try {
    const userId = req.user._id.toString();
    const { content } = req.validatedContent;
    const contentHash = crypto.createHash('md5').update(content).digest('hex');
    
    const duplicateKey = `message:duplicate:${userId}:${contentHash}`;
    const duplicateCount = await redisClient.incr(duplicateKey);
    
    if (duplicateCount === 1) {
      await redisClient.expire(duplicateKey, 300);
    }
    
    if (duplicateCount > 3) {
      console.warn(`🚫 Duplicate message flooding detected: ${userId}`);
      
      if (global.socketService) {
        global.socketService.sendNotificationToUser(userId, {
          type: 'warning',
          title: 'Duplicate Messages',
          message: 'You\'re sending the same message repeatedly. Please try sending different messages.',
          duration: 6000
        });
      }
      
      return res.status(429).json({
        success: false,
        message: 'You are sending the same message repeatedly. Please send different messages.',
        floodType: 'duplicate'
      });
    }
    
    const recentMessagesKey = `messages:recent:${userId}`;
    const recentMessages = await redisClient.lRange(recentMessagesKey, 0, 4);
    
    await redisClient.lPush(recentMessagesKey, content);
    await redisClient.lTrim(recentMessagesKey, 0, 9);
    await redisClient.expire(recentMessagesKey, 600);
    
    let similarCount = 0;
    for (const recentMessage of recentMessages) {
      const similarity = calculateSimilarity(content, recentMessage);
      if (similarity > 0.8) {
        similarCount++;
      }
    }
    
    if (similarCount >= 3) {
      console.warn(`🚫 Similar message pattern detected: ${userId}`);
      const suspiciousKey = `user:suspicious:${userId}`;
      await redisClient.setEx(suspiciousKey, 1800, 'true');
    }
    
    next();
  } catch (error) {
    console.error('Error detecting message flooding:', error);
    next();
  }
};

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

export const logMessageAttempt = async (req, res, next) => {
  const originalSend = res.json;
  const startTime = Date.now();
  
  res.json = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    setImmediate(async () => {
      try {
        const success = data.success === true;
        const userId = req.user._id;
        
        if (redisClient.isReady) {
          const logKey = `message:log:${userId}`;
          const logEntry = JSON.stringify({
            success,
            timestamp: Date.now(),
            messageType: req.body.messageType,
            contentLength: req.validatedContent?.content?.length || 0,
            rateLimit: req.messageRateLimit,
            ip: req.ip
          });
          
          await redisClient.lPush(logKey, logEntry);
          await redisClient.lTrim(logKey, 0, 99);
          await redisClient.expire(logKey, 3600);
        }
        
        console.log(`📊 Message attempt: ${req.user.username} ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`);
      } catch (error) {
        console.error('Error logging message attempt:', error);
      }
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

export default {
  checkMessageRateLimit,
  validateMessageContent,
  enhancedContentModeration,
  detectMessageFlooding,
  logMessageAttempt,
  MESSAGE_RATE_LIMITS,
  CONTENT_RULES
}; 