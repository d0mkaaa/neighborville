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

export const createSession = async (user, userAgent, ip) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const session = new Session({
      userId: user._id,
      token,
      expiresAt,
      clientInfo: {
        userAgent,
        ip,
        device: userAgent ? userAgent.split('(')[0] : 'Unknown'
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

export const storeVerificationCode = async (email, code, expiresInMinutes = 10) => {
  try {
    const key = `verification:${email}`;
    console.log(`Storing verification code for ${email}: ${code}`);
    await redisClient.set(key, code);
    await redisClient.expire(key, expiresInMinutes * 60);
    
    const storedCode = await redisClient.get(key);
    console.log(`Verification code stored for ${email}: ${storedCode}`);
    
    return true;
  } catch (error) {
    console.error('Error storing verification code:', error);
    return false;
  }
};

export const verifyCode = async (email, code) => {
  try {
    const key = `verification:${email}`;
    console.log(`Attempting to verify code for ${email}: ${code}`);
    
    const storedCode = await redisClient.get(key);
    console.log(`Retrieved stored code for ${email}: ${storedCode}`);
    
    if (!storedCode) {
      console.log(`No verification code found for ${email}`);
      return false;
    }
    
    const isMatch = String(storedCode).trim() === String(code).trim();
    console.log(`Code comparison result: ${isMatch}`);
    
    if (isMatch) {
      await redisClient.del(key);
      console.log(`Verification successful for ${email}, code deleted from Redis`);
      return true;
    } else {
      console.log(`Code mismatch for ${email}: expected ${storedCode}, got ${code}`);
      return false;
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    return false;
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

export const createGuestUser = async () => {
  try {
    const guestUser = User.createGuest();
    await guestUser.save();
    return guestUser;
  } catch (error) {
    console.error('Error creating guest user:', error);
    throw error;
  }
};
