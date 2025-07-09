import { redisClient } from '../config/database.js';
import { logger } from './logger.js';
import { getRealIP } from './ipUtils.js';

export const logSecurityEvent = async (userId, eventType, details = {}, req = null) => {
  try {
    const timestamp = new Date().toISOString();
    const ip = req ? getRealIP(req) : 'unknown';
    const userAgent = req ? req.headers['user-agent'] || 'unknown' : 'unknown';
    
    const logEntry = {
      userId: userId || 'unknown',
      eventType,
      details,
      ip,
      userAgent,
      timestamp,
      severity: getSeverityLevel(eventType)
    };
        
    logger.security(`${eventType} - User: ${userId} - IP: ${ip}`, details);
    
    if (redisClient.isReady) {
      await redisClient.rPush('security_events', JSON.stringify(logEntry));
      await redisClient.lTrim('security_events', -10000, -1);
      
      await redisClient.incr(`security_count:${eventType}`);
      await redisClient.expire(`security_count:${eventType}`, 86400);
    }
    
    return logEntry;
  } catch (error) {
    logger.error('Error logging security event:', error);
  }
};

const getSeverityLevel = (eventType) => {
  const severityMap = {
    'SUSPICIOUS_GAME_DATA': 'medium',
    'INVALID_TOKEN': 'low',
    'SESSION_NOT_FOUND': 'low', 
    'SESSION_EXPIRED': 'low',
    'RATE_LIMIT_EXCEEDED': 'medium',
    'IP_MISMATCH': 'high',
    'CSRF_ATTEMPT': 'high',
    'USER_NOT_FOUND': 'medium',
    'UNAUTHORIZED_ACCESS': 'high',
    'DATA_VALIDATION_FAILED': 'medium',
    'SAVE_CONFLICT': 'low',
    'AUTH_SUCCESS': 'info'
  };
  
  return severityMap[eventType] || 'medium';
};

export const getUserSecurityEvents = async (userId, limit = 100) => {
  if (!redisClient.isReady) {
    return [];
  }
  
  try {
    const events = await redisClient.lRange('security_events', -limit, -1);
    return events
      .map(event => JSON.parse(event))
      .filter(event => event.userId === userId)
      .reverse();
  } catch (error) {
    logger.error('Error retrieving user security events:', error);
    return [];
  }
};

export const getSecurityStats = async () => {
  if (!redisClient.isReady) {
    return {};
  }
  
  try {
    const keys = await redisClient.keys('security_count:*');
    const stats = {};
    
    for (const key of keys) {
      const eventType = key.replace('security_count:', '');
      const count = await redisClient.get(key);
      stats[eventType] = parseInt(count) || 0;
    }
    
    return stats;
  } catch (error) {
    logger.error('Error retrieving security stats:', error);
    return {};
  }
};

export default {
  logSecurityEvent,
  getUserSecurityEvents,
  getSecurityStats
}; 