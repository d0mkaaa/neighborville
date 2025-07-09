import { redisClient } from '../config/database.js';
import ModerationLog from '../models/ModerationLog.js';

const AUDIT_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  SESSION_EXPIRED: 'session_expired',
  
  USER_MODERATED: 'user_moderated',
  MESSAGE_BLOCKED: 'message_blocked',
  CONTENT_FLAGGED: 'content_flagged',
  
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  ENUMERATION_DETECTED: 'enumeration_detected',
  
  CONVERSATION_ACCESS: 'conversation_access',
  MESSAGE_ACCESS: 'message_access',
  DATA_EXPORT: 'data_export',
  
  USER_SUSPENDED: 'user_suspended',
  USER_BANNED: 'user_banned',
  ROLE_CHANGED: 'role_changed',
  SETTINGS_MODIFIED: 'settings_modified'
};

const SEVERITY_LEVELS = {
  INFO: 'info',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const createAuditLog = async (event) => {
  try {
    const {
      eventType,
      userId,
      targetUserId,
      severity = SEVERITY_LEVELS.INFO,
      description,
      metadata = {},
      ipAddress,
      userAgent,
      timestamp = new Date()
    } = event;

    if (!eventType || !Object.values(AUDIT_EVENTS).includes(eventType)) {
      console.error('Invalid audit event type:', eventType);
      return null;
    }

    const auditEntry = {
      eventType,
      userId: userId || null,
      targetUserId: targetUserId || null,
      severity,
      description: description || `${eventType} event`,
      metadata: {
        ...metadata,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        timestamp: timestamp.toISOString(),
        eventId: generateEventId()
      },
      createdAt: timestamp
    };

    const moderationLogEntry = new ModerationLog({
      userId: userId || new require('mongoose').Types.ObjectId(),
      moderatorId: null,
      contentType: 'audit_log',
      originalContent: description || `${eventType} event`,
      cleanedContent: '',
      violationType: mapEventTypeToViolationType(eventType),
      severity: severity,
      action: 'logged',
      reason: description || `Audit log: ${eventType}`,
      flaggedWords: [],
      flaggedPatterns: [],
      detectedItems: [eventType],
      isAutomated: true,
      metadata: auditEntry.metadata
    });

    await moderationLogEntry.save();

    if (redisClient.isReady) {
      const redisKey = `audit:${eventType}:${Date.now()}`;
      await redisClient.setEx(redisKey, 86400, JSON.stringify(auditEntry));

      await updateAuditStats(eventType, severity);
    }

    console.log(`📊 Audit log created: ${eventType} (${severity}) - ${description}`);
    return auditEntry;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
};

function mapEventTypeToViolationType(eventType) {
  const mapping = {
    [AUDIT_EVENTS.LOGIN_FAILURE]: 'security_violation',
    [AUDIT_EVENTS.UNAUTHORIZED_ACCESS]: 'privacy_violation',
    [AUDIT_EVENTS.RATE_LIMIT_EXCEEDED]: 'abuse',
    [AUDIT_EVENTS.SUSPICIOUS_ACTIVITY]: 'security_violation',
    [AUDIT_EVENTS.ENUMERATION_DETECTED]: 'security_violation',
    [AUDIT_EVENTS.MESSAGE_BLOCKED]: 'profanity',
    [AUDIT_EVENTS.CONTENT_FLAGGED]: 'other',
    [AUDIT_EVENTS.USER_MODERATED]: 'other'
  };
  
  return mapping[eventType] || 'other';
}

function generateEventId() {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function updateAuditStats(eventType, severity) {
  if (!redisClient.isReady) return;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    await redisClient.incr(`audit:stats:daily:${today}:${eventType}`);
    await redisClient.incr(`audit:stats:daily:${today}:severity:${severity}`);
    await redisClient.incr(`audit:stats:daily:${today}:total`);
    
    await redisClient.expire(`audit:stats:daily:${today}:${eventType}`, 2592000);
    await redisClient.expire(`audit:stats:daily:${today}:severity:${severity}`, 2592000);
    await redisClient.expire(`audit:stats:daily:${today}:total`, 2592000);
    
    const hour = new Date().getHours();
    await redisClient.incr(`audit:stats:hourly:${today}:${hour}:${eventType}`);
    await redisClient.expire(`audit:stats:hourly:${today}:${hour}:${eventType}`, 86400);
  } catch (error) {
    console.error('Error updating audit stats:', error);
  }
}

export const auditMiddleware = (eventType, options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    const originalSend = res.json;
    res.json = function(data) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      setImmediate(async () => {
        try {
          const success = data.success !== false;
          const severity = determineSeverity(eventType, success, data, options);
          
          await createAuditLog({
            eventType,
            userId: req.user?._id,
            targetUserId: options.getTargetUserId ? options.getTargetUserId(req, data) : null,
            severity,
            description: options.getDescription ? 
              options.getDescription(req, data, success) : 
              `${eventType} ${success ? 'succeeded' : 'failed'}`,
            metadata: {
              ...options.metadata,
              success,
              duration,
              httpStatus: res.statusCode,
              method: req.method,
              path: req.path,
              query: req.query,
              body: options.logBody ? sanitizeBody(req.body) : undefined
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });
        } catch (error) {
          console.error('Error in audit middleware:', error);
        }
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

function determineSeverity(eventType, success, data, options) {
  if (options.severity) return options.severity;
  
  if (!success) {
    switch (eventType) {
      case AUDIT_EVENTS.LOGIN_FAILURE:
      case AUDIT_EVENTS.UNAUTHORIZED_ACCESS:
        return SEVERITY_LEVELS.MEDIUM;
      case AUDIT_EVENTS.ENUMERATION_DETECTED:
      case AUDIT_EVENTS.SUSPICIOUS_ACTIVITY:
        return SEVERITY_LEVELS.HIGH;
      default:
        return SEVERITY_LEVELS.LOW;
    }
  }
  
  switch (eventType) {
    case AUDIT_EVENTS.USER_BANNED:
    case AUDIT_EVENTS.ROLE_CHANGED:
      return SEVERITY_LEVELS.HIGH;
    case AUDIT_EVENTS.USER_SUSPENDED:
    case AUDIT_EVENTS.USER_MODERATED:
      return SEVERITY_LEVELS.MEDIUM;
    default:
      return SEVERITY_LEVELS.LOW;
  }
}

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  if (sanitized.content && sanitized.content.length > 200) {
    sanitized.content = sanitized.content.substring(0, 200) + '...';
  }
  
  return sanitized;
}

export const getAuditStats = async (timeframe = 'daily') => {
  if (!redisClient.isReady) return null;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const stats = {};
    
    if (timeframe === 'daily') {
      const keys = await redisClient.keys(`audit:stats:daily:${today}:*`);
      for (const key of keys) {
        const value = await redisClient.get(key);
        const keyParts = key.split(':');
        const statName = keyParts.slice(4).join(':');
        stats[statName] = parseInt(value) || 0;
      }
    } else if (timeframe === 'hourly') {
      const hourlyStats = {};
      for (let i = 0; i < 24; i++) {
        const hour = (new Date().getHours() - i + 24) % 24;
        const keys = await redisClient.keys(`audit:stats:hourly:${today}:${hour}:*`);
        
        hourlyStats[hour] = {};
        for (const key of keys) {
          const value = await redisClient.get(key);
          const keyParts = key.split(':');
          const eventType = keyParts[5];
          hourlyStats[hour][eventType] = parseInt(value) || 0;
        }
      }
      stats.hourly = hourlyStats;
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting audit stats:', error);
    return null;
  }
};

export const checkSecurityAlerts = async () => {
  if (!redisClient.isReady) return;
  
  try {
    const stats = await getAuditStats('hourly');
    if (!stats || !stats.hourly) return;
    
    const currentHour = new Date().getHours();
    const currentHourStats = stats.hourly[currentHour] || {};
    
    const thresholds = {
      [AUDIT_EVENTS.LOGIN_FAILURE]: 20,
      [AUDIT_EVENTS.UNAUTHORIZED_ACCESS]: 10,
      [AUDIT_EVENTS.RATE_LIMIT_EXCEEDED]: 50,
      [AUDIT_EVENTS.ENUMERATION_DETECTED]: 5
    };
    
    for (const [eventType, threshold] of Object.entries(thresholds)) {
      const count = currentHourStats[eventType] || 0;
      if (count >= threshold) {
        console.warn(`🚨 SECURITY ALERT: ${eventType} exceeded threshold (${count}/${threshold})`);

        await createAuditLog({
          eventType: AUDIT_EVENTS.SUSPICIOUS_ACTIVITY,
          severity: SEVERITY_LEVELS.CRITICAL,
          description: `Security alert: ${eventType} threshold exceeded (${count}/${threshold})`,
          metadata: {
            alertType: 'threshold_exceeded',
            eventType,
            count,
            threshold,
            timeframe: 'hourly'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking security alerts:', error);
  }
};


export { AUDIT_EVENTS, SEVERITY_LEVELS };

export default {
  createAuditLog,
  auditMiddleware,
  getAuditStats,
  checkSecurityAlerts,
  AUDIT_EVENTS,
  SEVERITY_LEVELS
}; 