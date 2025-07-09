import { redisClient } from '../config/database.js';
import ModerationLog from '../models/ModerationLog.js';

const MODERATION_RATE_LIMITS = {
  timeout: { count: 10, window: 300 },
  ban: { count: 5, window: 600 },
  mute: { count: 15, window: 300 },
  kick: { count: 20, window: 300 },
  global: { count: 30, window: 300 }
};

const VALID_TIMEOUT_DURATIONS = {
  timeout: [60, 300, 900, 1800, 3600, 7200],
  mute: [60, 300, 600, 1800, 3600],
  ban: [3600, 86400, 604800, 2592000, null]
};

export const checkModerationRateLimit = async (req, res, next) => {
  if (!redisClient.isReady) return next();
  
  const moderatorId = req.user._id.toString();
  const { action } = req.body;
  
  try {
    if (action && MODERATION_RATE_LIMITS[action]) {
      const actionKey = `moderation:${action}:${moderatorId}`;
      const actionCount = await redisClient.incr(actionKey);
      
      if (actionCount === 1) {
        await redisClient.expire(actionKey, MODERATION_RATE_LIMITS[action].window);
      }
      
      if (actionCount > MODERATION_RATE_LIMITS[action].count) {
        console.warn(`🚫 Moderation rate limit exceeded for ${action} by moderator ${moderatorId}`);
        return res.status(429).json({
          success: false,
          message: `Too many ${action} actions. Please wait before trying again.`,
          rateLimitType: action,
          retryAfter: MODERATION_RATE_LIMITS[action].window
        });
      }
    }
    
    const globalKey = `moderation:global:${moderatorId}`;
    const globalCount = await redisClient.incr(globalKey);
    
    if (globalCount === 1) {
      await redisClient.expire(globalKey, MODERATION_RATE_LIMITS.global.window);
    }
    
    if (globalCount > MODERATION_RATE_LIMITS.global.count) {
      console.warn(`🚫 Global moderation rate limit exceeded by moderator ${moderatorId}`);
      return res.status(429).json({
        success: false,
        message: 'Too many moderation actions. Please wait before trying again.',
        rateLimitType: 'global',
        retryAfter: MODERATION_RATE_LIMITS.global.window
      });
    }
    
    req.moderationRateLimit = {
      actionCount: actionCount || 0,
      globalCount,
      action
    };
    
    next();
  } catch (error) {
    console.error('Error checking moderation rate limit:', error);
    next();
  }
};

export const validateModerationAction = async (req, res, next) => {
  try {
    const { userId, action, duration } = req.body;
    const { roomId } = req.params;
    const moderatorId = req.user._id;
    
    if (!['timeout', 'ban', 'mute', 'kick'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid moderation action',
        validActions: ['timeout', 'ban', 'mute', 'kick']
      });
    }
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid target user ID is required'
      });
    }
    
    if (userId === moderatorId.toString()) {
      console.warn(`🚫 Self-moderation attempt by ${moderatorId}`);
      return res.status(400).json({
        success: false,
        message: 'Cannot moderate yourself'
      });
    }
    
    if (['timeout', 'mute', 'ban'].includes(action) && duration !== undefined) {
      if (duration !== null && (!Number.isInteger(duration) || duration <= 0)) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be a positive integer (seconds) or null for permanent'
        });
      }
      
      const validDurations = VALID_TIMEOUT_DURATIONS[action];
      if (duration !== null && !validDurations.includes(duration)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${action} duration`,
          validDurations: validDurations.filter(d => d !== null),
          allowPermanent: validDurations.includes(null)
        });
      }
    }
    
    const User = (await import('../models/User.js')).default;
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }
    
    const moderatorRole = req.user.role;
    const targetRole = targetUser.role;
    
    const roleHierarchy = { 'user': 0, 'moderator': 1, 'admin': 2 };
    const moderatorLevel = roleHierarchy[moderatorRole] || 0;
    const targetLevel = roleHierarchy[targetRole] || 0;
    
    if (targetLevel >= moderatorLevel) {
      console.warn(`🚫 Privilege escalation attempt: ${moderatorRole} ${moderatorId} trying to moderate ${targetRole} ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'Cannot moderate users with equal or higher privileges'
      });
    }

    req.moderationData = {
      targetUser,
      moderatorLevel,
      targetLevel,
      validatedAction: action,
      validatedDuration: duration
    };
    
    next();
  } catch (error) {
    console.error('Error validating moderation action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate moderation action'
    });
  }
};

export const logModerationAttempt = async (req, res, next) => {
  const originalSend = res.json;
  const startTime = Date.now();
  
  res.json = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    setImmediate(async () => {
      try {
        const { userId, action } = req.body;
        const moderatorId = req.user._id;
        const success = data.success === true;
        
        const logData = {
          moderatorId,
          targetUserId: userId,
          action,
          duration: req.body.duration,
          roomId: req.params.roomId,
          success,
          responseTime: duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          rateLimit: req.moderationRateLimit,
          timestamp: new Date()
        };
        
        if (!success) {
          logData.errorMessage = data.message;
          logData.errorCode = res.statusCode;
        }
        
        await ModerationLog.create({
          userId: moderatorId,
          moderatorId,
          contentType: 'moderation_action',
          originalContent: JSON.stringify({
            targetUser: userId,
            action,
            duration: req.body.duration,
            roomId: req.params.roomId
          }),
          cleanedContent: '',
          violationType: 'moderation',
          severity: success ? 'low' : 'medium',
          action: success ? 'completed' : 'failed',
          reason: `${action} attempt ${success ? 'successful' : 'failed'}: ${data.message || ''}`,
          flaggedWords: [],
          flaggedPatterns: [],
          detectedItems: [action],
          isAutomated: false,
          metadata: {
            responseTime: duration,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            rateLimit: req.moderationRateLimit
          }
        });
        
        console.log(`📊 Moderation audit: ${req.user.username} ${action} ${success ? 'SUCCESS' : 'FAILED'} on user ${userId} (${duration}ms)`);
      } catch (error) {
        console.error('Error logging moderation attempt:', error);
      }
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

export const detectSuspiciousModerationPatterns = async (req, res, next) => {
  if (!redisClient.isReady) return next();
  
  try {
    const moderatorId = req.user._id.toString();
    const { userId: targetUserId, action } = req.body;
    
    const targetKey = `moderation:target:${moderatorId}:${targetUserId}`;
    const targetCount = await redisClient.incr(targetKey);
    
    if (targetCount === 1) {
      await redisClient.expire(targetKey, 3600);
    }
    
    if (targetCount > 5) {
      console.warn(`🚨 Suspicious moderation pattern: ${moderatorId} has taken ${targetCount} actions against ${targetUserId} in the last hour`);
      
      await ModerationLog.create({
        userId: moderatorId,
        moderatorId: null,
        contentType: 'suspicious_activity',
        originalContent: `Repeated moderation actions against user ${targetUserId}`,
        cleanedContent: '',
        violationType: 'abuse',
        severity: 'high',
        action: 'flagged',
        reason: `Potentially abusive moderation pattern detected: ${targetCount} actions against same user`,
        flaggedWords: [],
        flaggedPatterns: ['repeated_targeting'],
        detectedItems: [action],
        isAutomated: true
      });
    }
    
    const burstKey = `moderation:burst:${moderatorId}`;
    const burstCount = await redisClient.incr(burstKey);
    
    if (burstCount === 1) {
      await redisClient.expire(burstKey, 60);
    }
    
    if (burstCount > 10) {
      console.warn(`🚨 Burst moderation activity detected: ${moderatorId} has taken ${burstCount} actions in the last minute`);
      
      return res.status(429).json({
        success: false,
        message: 'Moderation activity temporarily restricted due to unusual patterns',
        retryAfter: 60
      });
    }
    
    next();
  } catch (error) {
    console.error('Error detecting suspicious moderation patterns:', error);
    next();
  }
};

export default {
  checkModerationRateLimit,
  validateModerationAction,
  logModerationAttempt,
  detectSuspiciousModerationPatterns,
  VALID_TIMEOUT_DURATIONS,
  MODERATION_RATE_LIMITS
}; 