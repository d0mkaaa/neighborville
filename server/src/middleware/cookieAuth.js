import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';

const JWT_SECRET = process.env.JWT_SECRET || 'neighborvillesecretkey';

export const createToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

export const setAuthCookie = (res, userId) => {
  const token = createToken(userId);
  res.cookie('token', token, cookieOptions);
  return token;
};

export const auth = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      console.log('Auth middleware - No token found');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      console.log('Auth middleware - Token verification failed');
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    console.log('Auth middleware - Token verified for user ID:', decoded.userId);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('Auth middleware - User not found for ID:', decoded.userId);
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    let session = await Session.findOne({ 
      userId: decoded.userId,
      token: token
    });
    
    if (!session) {
      try {
        const userAgent = req.headers['user-agent'];
        const ip = req.ip;
        session = await Session.create({
          userId: decoded.userId,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          clientInfo: {
            userAgent,
            ip,
            device: userAgent ? userAgent.split('(')[0] : 'Unknown'
          }
        });
        console.log('Auth middleware - Created new session for user');
      } catch (error) {
        console.error('Error creating session:', error);
      }
    } else {
      session.lastActive = new Date();
      await session.save().catch(err => {
        console.warn('Error updating session lastActive time:', err);
      });
    }
    
    req.session = session || { token };
    req.user = user;
    
    console.log('Auth middleware - Authentication successful for user:', user.username || user.email);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return next();
    }
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next();
    }
    
    const session = await Session.findOne({ 
      userId: decoded.userId,
      token: token
    });
    
    if (session) {
      session.lastActive = new Date();
      await session.save().catch(() => {});
      req.session = session;
    } else {
      req.session = { token };
    }
    
    req.user = user;
    next();
  } catch (error) {
    next();
  }
};
