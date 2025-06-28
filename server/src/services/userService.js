import User from '../models/User.js';
import Session from '../models/Session.js';
import { createToken } from '../middleware/auth.js';
import { redisClient } from '../config/database.js';
import crypto from 'crypto';

export const createUser = async (email, username, password = null) => {
  try {
    const user = new User({
      email,
      username: username || email.split('@')[0],
      password: password || Math.random().toString(36).slice(-10),
      verified: false
    });
    
    await user.save();
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const findUserByEmail = async (email) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
};

export const findUserById = async (userId) => {
  try {
    return await User.findById(userId);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
};

export const findUserByUsername = async (username) => {
  try {
    return await User.findOne({ username });
  } catch (error) {
    console.error('Error finding user by username:', error);
    return null;
  }
};

const getLocationFromIP = async (ip) => {
  try {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {
        country: 'Local Network',
        city: 'Local',
        region: 'Local',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    }

    return {
      country: 'Unknown',
      city: 'Unknown', 
      region: 'Unknown',
      timezone: 'UTC'
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown', 
      timezone: 'UTC'
    };
  }
};

const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Unknown'
    };
  }

  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    device = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    device = 'Tablet';
  }

  return { browser, os, device };
};

const sanitizeIP = (ip) => {
  if (ip && ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip || 'Unknown';
};

export const createSession = async (user, userAgent, rawIp) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const ip = sanitizeIP(rawIp);
    const location = await getLocationFromIP(ip);
    const deviceInfo = parseUserAgent(userAgent);
    
    const session = new Session({
      userId: user._id,
      token,
      expiresAt,
      clientInfo: {
        userAgent,
        ip,
        location,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device: deviceInfo.device,
        createdAt: new Date()
      }
    });
    
    await session.save();
    
    user.lastLogin = new Date();
    await user.save();
    
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const validateSession = async (token) => {
  try {
    const session = await Session.findOne({ token });
    return session && session.isValid();
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
};

export const refreshSession = async (token) => {
  try {
    const session = await Session.findOne({ token });
    
    if (!session || !session.isValid()) {
      return false;
    }
    
    session.refresh();
    await session.save();
    return true;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return false;
  }
};

export const deleteSession = async (token) => {
  try {
    await Session.deleteOne({ token });
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
};

export const deleteSessionById = async (sessionId, userId) => {
  try {
    const result = await Session.deleteOne({ _id: sessionId, userId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting session by ID:', error);
    return false;
  }
};

export const deleteOtherSessions = async (userId, currentToken) => {
  try {
    await Session.deleteMany({ 
      userId, 
      token: { $ne: currentToken } 
    });
    return true;
  } catch (error) {
    console.error('Error deleting other sessions:', error);
    return false;
  }
};

export const getUserSessions = async (userId) => {
  try {
    return await Session.find({ userId }).sort({ lastActive: -1 });
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
};

export const storeVerificationCode = async (email, code, expiresInMinutes = 15) => {
  try {
    const key = `verification:${email.toLowerCase().trim()}`;
    console.log(`📝 STORING verification code for ${email}: ${code} (expires in ${expiresInMinutes} minutes)`);
    
    await redisClient.setEx(key, expiresInMinutes * 60, code);
    
    const storedCode = await redisClient.get(key);
    const ttl = await redisClient.ttl(key);
    console.log(`✅ VERIFIED storage - Code: ${storedCode}, TTL: ${ttl}s`);
    
    if (storedCode === code) {
      return true;
    } else {
      console.error(`❌ STORAGE VERIFICATION FAILED - Expected: ${code}, Got: ${storedCode}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error storing verification code:', error);
    return false;
  }
};

export const verifyCode = async (email, code) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = String(code).trim();
    const key = `verification:${normalizedEmail}`;
    
    console.log(`🔍 VERIFYING code for ${normalizedEmail}: ${normalizedCode}`);
    
    const storedCode = await redisClient.get(key);
    const ttl = await redisClient.ttl(key);
    
    console.log(`📋 RETRIEVED from Redis - Key: ${key}, Code: ${storedCode}, TTL: ${ttl}s`);
    
    if (!storedCode) {
      console.log(`❌ NO CODE FOUND for ${normalizedEmail} - checking all verification keys...`);
      
      try {
        const allKeys = await redisClient.keys('verification:*');
        console.log(`🔍 ALL VERIFICATION KEYS:`, allKeys);
        
        for (const debugKey of allKeys) {
          const debugCode = await redisClient.get(debugKey);
          const debugTtl = await redisClient.ttl(debugKey);
          console.log(`   - ${debugKey}: ${debugCode} (TTL: ${debugTtl}s)`);
        }
      } catch (debugError) {
        console.error('Debug key listing failed:', debugError);
      }
      
      return { 
        valid: false, 
        error: 'No verification code found or code has expired. Please request a new code.' 
      };
    }
    
    const normalizedStoredCode = String(storedCode).trim();
    const isMatch = normalizedStoredCode === normalizedCode;
    
    console.log(`🔄 CODE COMPARISON - Expected: "${normalizedStoredCode}", Got: "${normalizedCode}", Match: ${isMatch}`);
    
    if (isMatch) {
      await redisClient.del(key);
      console.log(`✅ VERIFICATION SUCCESSFUL for ${normalizedEmail}, code deleted from Redis`);
      return { valid: true };
    } else {
      console.log(`❌ CODE MISMATCH for ${normalizedEmail}`);
      return { 
        valid: false, 
        error: 'Invalid verification code. Please check the code and try again.' 
      };
    }
  } catch (error) {
    console.error('❌ Error verifying code:', error);
    return { 
      valid: false, 
      error: 'Server error during verification. Please try again.' 
    };
  }
};

export const markUserVerified = async (email) => {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return false;
    }
    
    user.verified = true;
    await user.save();
    return true;
  } catch (error) {
    console.error('Error marking user as verified:', error);
    return false;
  }
};

export const updateUserSettings = async (userId, settings) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return false;
    }
    
    user.settings = { ...user.settings, ...settings };
    await user.save();
    return true;
  } catch (error) {
    console.error('Error updating user settings:', error);
    return false;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return false;
    }
    
    if (userData.username) user.username = userData.username;
    if (userData.email) user.email = userData.email;
    if (userData.profileSettings) {
      user.profileSettings = {
        ...user.profileSettings,
        ...userData.profileSettings
      };
    }
    
    await user.save();
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

export const getStoredVerificationCode = async (email) => {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const key = `verification:${normalizedEmail}`;
    
    console.log(`🔍 CHECKING for existing code for ${normalizedEmail}`);
    
    const storedCode = await redisClient.get(key);
    const ttl = await redisClient.ttl(key);
    
    console.log(`📋 FOUND existing code: ${storedCode ? 'Yes' : 'No'}, TTL: ${ttl}s`);
    
    if (storedCode && ttl > 120) {
      console.log(`♻️ REUSING existing code for ${normalizedEmail} (${Math.floor(ttl/60)} minutes remaining)`);
      return storedCode;
    } else if (storedCode && ttl <= 120) {
      console.log(`⏰ EXISTING code for ${normalizedEmail} expires soon (${ttl}s), will generate new one`);
      await redisClient.del(key);
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error retrieving verification code:', error);
    return null;
  }
};
