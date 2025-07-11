import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { redisClient } from '../config/database.js';
import { getRealIP } from '../utils/ipUtils.js';

const JWT_SECRET = process.env.JWT_SECRET;
const MAX_REQUESTS_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW = 60;

export const createToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const checkRateLimit = async (userId, ip) => {
  if (!redisClient.isReady) return true;
  
  const userKey = `ratelimit:user:${userId}`;
  const ipKey = `ratelimit:ip:${ip}`;
  
  try {
    const userRequests = await redisClient.incr(userKey);
    const ipRequests = await redisClient.incr(ipKey);
    
    if (userRequests === 1) {
      await redisClient.expire(userKey, RATE_LIMIT_WINDOW);
    }
    
    if (ipRequests === 1) {
      await redisClient.expire(ipKey, RATE_LIMIT_WINDOW);
    }
    
    return userRequests <= MAX_REQUESTS_PER_MINUTE && ipRequests <= MAX_REQUESTS_PER_MINUTE;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true;
  }
};

const logSecurityAction = async (userId, action, ip, userAgent, isSuccess) => {
  try {
    if (!isSuccess) {
      console.log(`SECURITY_LOG: User=${userId} Action=${action} IP=${ip} Success=${isSuccess} UserAgent=${userAgent}`);
    }
    
    if (redisClient.isReady) {
      const logEntry = JSON.stringify({
        userId,
        action,
        ip,
        userAgent,
        isSuccess,
        timestamp: new Date().toISOString()
      });
      
      await redisClient.rPush('security_logs', logEntry);
      await redisClient.lTrim('security_logs', -1000, -1);
    }
  } catch (error) {
    console.error('Error logging security action:', error);
  }
};

export const auth = async (req, res, next) => {
  try {
    const token = req.cookies.neighborville_auth || 
                  req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    const ip = getRealIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const requestOrigin = req.headers.origin;
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost').split(',');
    
    if (req.method !== 'GET' && requestOrigin && !allowedOrigins.includes(requestOrigin)) {
      console.error(`Possible CSRF attempt: Origin ${requestOrigin} not allowed`);
      await logSecurityAction('unknown', 'CSRF_ATTEMPT', ip, userAgent, false);
      return res.status(403).json({ success: false, message: 'Invalid origin' });
    }
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      await logSecurityAction('unknown', 'INVALID_TOKEN', ip, userAgent, false);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    const user = await User.findById(decoded.userId).populate('suspensions.issuedBy', 'username');
    if (!user) {
      await logSecurityAction(decoded.userId, 'USER_NOT_FOUND', ip, userAgent, false);
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    const session = await Session.findOne({ token, userId: decoded.userId });
    if (!session) {
      await logSecurityAction(decoded.userId, 'SESSION_NOT_FOUND', ip, userAgent, false);
      return res.status(401).json({ success: false, message: 'Session not found' });
    }
    
    if (!session.isValid()) {
      await logSecurityAction(decoded.userId, 'SESSION_EXPIRED', ip, userAgent, false);
      return res.status(401).json({ success: false, message: 'Session expired' });
    }
    
    const withinRateLimit = await checkRateLimit(decoded.userId, ip);
    if (!withinRateLimit) {
      await logSecurityAction(decoded.userId, 'RATE_LIMIT_EXCEEDED', ip, userAgent, false);
      return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
    }
    
    const isSensitiveOperation = req.path.includes('/game/save') || 
                               req.path.includes('/profile') || 
                               req.method === 'DELETE';
    
    if (isSensitiveOperation && session.clientInfo && session.clientInfo.ip) {
      const ipMatches = ip === session.clientInfo.ip || 
                     ip.startsWith(session.clientInfo.ip.split('.').slice(0, 3).join('.'));
      
      if (!ipMatches) {
        console.warn(`IP mismatch for user ${decoded.userId}. Session IP: ${session.clientInfo.ip}, Current IP: ${ip}`);
        await logSecurityAction(decoded.userId, 'IP_MISMATCH', ip, userAgent, false);
        
        if (req.method === 'DELETE' || req.path.includes('/password')) {
          return res.status(403).json({ 
            success: false, 
            message: 'Security verification required',
            reauth: true
          });
        }
      }
    }
    
    session.lastActive = new Date();
    await session.save();
    
    await logSecurityAction(decoded.userId, 'AUTH_SUCCESS', ip, userAgent, true);
    
    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.neighborville_auth || 
                  req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return next();
    }
    
    const user = await User.findById(decoded.userId).populate('suspensions.issuedBy', 'username');
    const session = await Session.findOne({ token, userId: decoded.userId });
    
    if (user && session && session.isValid()) {
      session.lastActive = new Date();
      await session.save();
      
      req.user = user;
      req.session = session;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};
