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
    return null;
  }
};

export const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    console.log('Auth middleware - Cookies:', req.cookies);
    console.log('Auth middleware - Authorization header:', req.headers.authorization);
    
    if (!token) {
      console.log('Auth middleware - No token found');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    console.log('Auth middleware - Token found:', token.substring(0, 10) + '...');
    
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Auth middleware - Token verification failed');
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    
    console.log('Auth middleware - Token verified for user ID:', decoded.userId);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('Auth middleware - User not found for ID:', decoded.userId);
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    const session = await Session.findOne({ token, userId: decoded.userId });
    if (!session) {
      console.log('Auth middleware - Session not found for token');
      return res.status(401).json({ success: false, message: 'Session not found' });
    }
    
    if (!session.isValid()) {
      console.log('Auth middleware - Session is invalid or expired');
      return res.status(401).json({ success: false, message: 'Session expired' });
    }
    
    console.log('Auth middleware - Authentication successful for user:', user.username || user.email);
    
    session.lastActive = new Date();
    await session.save();
    
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
    const token = req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return next();
    }
    
    const user = await User.findById(decoded.userId);
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
