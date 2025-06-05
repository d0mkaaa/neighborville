import User from '../models/User.js';
import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  createUser,
  findUserByEmail,
  findUserById,
  storeVerificationCode,
  verifyCode,
  markUserVerified,
  createSession,
  deleteSession,
  deleteSessionById,
  validateSession,
  refreshSession,
  getUserSessions,
  deleteOtherSessions,
  updateUserSettings,
  updateUser,
  findUserByUsername
} from '../services/userService.js';
import { generateVerificationCode, sendVerificationEmail } from '../services/email.js';
import { auth, optionalAuth, createToken, cookieOptions, setAuthCookie, verifyToken } from '../middleware/cookieAuth.js';

const router = express.Router();

router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { email, username } = req.body;
    const password = Math.random().toString(36).slice(-10);
    
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    
    if (username) {
      const existingUsername = await findUserByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ success: false, message: 'Username already taken' });
      }
    }
    
    const user = await createUser(email, username, password);
    
    const code = generateVerificationCode();
    await storeVerificationCode(email, code);
    
    await sendVerificationEmail(email, code, username);
    
    res.status(201).json({
      success: true,
      message: 'User registered, verification email sent',
      userId: user._id
    });
  } catch (error) {
    console.error('Error in /register route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { email } = req.body;
    
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email not registered' });
    }
    

    const code = generateVerificationCode();
    await storeVerificationCode(email, code);
    
    await sendVerificationEmail(email, code, user.username);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent, please check your inbox',
      emailSent: true
    });
  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/verify', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('code').notEmpty().withMessage('Verification code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { email, code, username } = req.body;
    console.log(`Verification request received for ${email} with code ${code}`);
    
    let user = await findUserByEmail(email);
    let isNewRegistration = false;
    
    if (!user) {
      console.log(`User not found for email: ${email}, this is a new registration`);
      isNewRegistration = true;
      
      if (!username) {
        const isValid = await verifyCode(email, code);
        if (!isValid) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid or expired verification code' 
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Code verified, username required',
          isNewRegistration: true
        });
      }
      
      try {
        if (username) {
          const existingUsername = await findUserByUsername(username);
          if (existingUsername) {
            return res.status(409).json({ 
              success: false, 
              message: 'Username already taken' 
            });
          }
        }
        
        user = await createUser(email, username || email.split('@')[0]);
        console.log(`Created new user for ${email} with username ${user.username}`);
      } catch (error) {
        console.error(`Error creating user for ${email}:`, error);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to create user' 
        });
      }
    } else if (username && !user.username) {
      user.username = username;
      await user.save();
      console.log(`Updated username for ${email} to ${username}`);
    }
    
    const isValid = await verifyCode(email, code);
    console.log(`Verification result for ${email}: ${isValid}`);
    
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code' 
      });
    }
    
    await markUserVerified(email);
    console.log(`User ${email} marked as verified`);
    
    const userAgent = req.headers['user-agent'];
    const ip = req.ip;
    const session = await createSession(user, userAgent, ip);
    
    const token = setAuthCookie(res, user._id);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: user.toProfile(),
      token: token,
      isNewRegistration
    });
  } catch (error) {
    console.error('Error in /verify route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/logout', auth, async (req, res) => {
  try {
    await deleteSession(req.session.token);
    
    res.clearCookie('neighborville_auth');
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error in /logout route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user.toProfile()
    });
  } catch (error) {
    console.error('Error in /me route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/resend-verification', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { email } = req.body;
    
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.verified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }
    
    const code = generateVerificationCode();
    await storeVerificationCode(email, code);
    
    await sendVerificationEmail(email, code, user.username);
    
    res.status(200).json({
      success: true,
      message: 'Verification email resent'
    });
  } catch (error) {
    console.error('Error in /resend-verification route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/settings', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    
    await updateUserSettings(req.user._id, settings);

    const user = await findUserById(req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      user: user.toProfile()
    });
  } catch (error) {
    console.error('Error in /settings route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await getUserSessions(req.user._id);
    
    res.status(200).json({
      success: true,
      sessions: sessions.map(session => ({
        id: session._id,
        createdAt: session.createdAt,
        lastActive: session.lastActive,
        expiresAt: session.expiresAt,
        clientInfo: session.clientInfo,
        current: session.token === req.session.token
      }))
    });
  } catch (error) {
    console.error('Error in /sessions route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/sessions', auth, async (req, res) => {
  try {
    await deleteOtherSessions(req.user._id, req.session.token);
    
    res.status(200).json({
      success: true,
      message: 'All other sessions have been logged out'
    });
  } catch (error) {
    console.error('Error in DELETE /sessions route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/sessions/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (req.session._id.toString() === sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete current session. Use logout instead.' 
      });
    }
    
    const success = await deleteSessionById(sessionId, req.user._id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or unauthorized'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /sessions/:sessionId route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/profile', auth, [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { username } = req.body;
    
    if (username) {
      const existingUser = await findUserByUsername(username);
      if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
        return res.status(409).json({ success: false, message: 'Username already taken' });
      }
    }
    
    await updateUser(req.user._id, { username });
    
    const user = await findUserById(req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toProfile()
    });
  } catch (error) {
    console.error('Error in /profile route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/game/save', auth, async (req, res) => {
  try {
    const { gameData } = req.body;
    
    if (!gameData) {
      return res.status(400).json({ success: false, message: 'No game data provided' });
    }
    
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() !== req.user._id.toString()) {
      console.error(`Security violation: User ${req.user._id} attempted to save data for user ${user._id}`);
      return res.status(403).json({ success: false, message: 'Unauthorized access to user data' });
    }
    
    user.gameData = gameData;
    user.lastSave = new Date();
    
    if (!user.gameSaves) {
      user.gameSaves = [];
    }
    
    const saveId = gameData.saveId || `save-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const existingIndex = user.gameSaves.findIndex(save => save.id === saveId);
    
    const saveEntry = {
      id: saveId,
      playerName: gameData.playerName || 'Unknown',
      data: gameData,
      timestamp: gameData.saveTimestamp || Date.now(),
      saveType: 'manual',
      version: gameData.version || '1.0'
    };
    
    if (existingIndex >= 0) {
      user.gameSaves[existingIndex] = saveEntry;
    } else {
      user.gameSaves.push(saveEntry);
    }
    
    if (user.gameSaves.length > 30) {
      user.gameSaves.sort((a, b) => b.timestamp - a.timestamp);
      user.gameSaves = user.gameSaves.slice(0, 30);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Game data saved successfully',
      lastSave: user.lastSave
    });
  } catch (error) {
    console.error('Error in /game/save route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/game/saves/batch', auth, async (req, res) => {
  try {
    const { saves } = req.body;
    
    if (!saves || !Array.isArray(saves) || saves.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid saves provided' });
    }
    
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!user.gameSaves) {
      user.gameSaves = [];
    }
    
    let savedCount = 0;
    const processedIds = new Set();
    
    for (const save of saves) {
      if (!save.id || !save.data || processedIds.has(save.id)) {
        continue;
      }
      
      processedIds.add(save.id);
      
      const existingIndex = user.gameSaves.findIndex(existingSave => existingSave.id === save.id);
      
      if (existingIndex >= 0) {
        user.gameSaves[existingIndex] = {
          id: save.id,
          playerName: save.data.playerName || 'Unknown',
          data: save.data,
          timestamp: save.data.saveTimestamp || Date.now(),
          saveType: save.saveType || 'manual',
          version: save.data.version || '1.0'
        };
      } else {
        user.gameSaves.push({
          id: save.id,
          playerName: save.data.playerName || 'Unknown',
          data: save.data,
          timestamp: save.data.saveTimestamp || Date.now(),
          saveType: save.saveType || 'manual',
          version: save.data.version || '1.0'
        });
      }
      
      savedCount++;
    }
    
    if (user.gameSaves.length > 30) {
      user.gameSaves.sort((a, b) => b.timestamp - a.timestamp);
      user.gameSaves = user.gameSaves.slice(0, 30);
    }
    
    user.lastSave = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Saved ${savedCount} game saves successfully`,
      savedCount
    });
  } catch (error) {
    console.error('Error in /game/saves/batch route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/game/save/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'No save ID provided' });
    }
    
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() !== req.user._id.toString()) {
      console.error(`Security violation: User ${req.user._id} attempted to delete save for user ${user._id}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access to user saves'
      });
    }
    
    if (!user.gameSaves) {
      user.gameSaves = [];
    }
    
    const saveIndex = user.gameSaves.findIndex(save => save.id === id);
    
    if (saveIndex === -1) {
      console.log(`Save ID ${id} not found in user's saves collection`);
      
      return res.status(200).json({
        success: true,
        message: 'Save not found on server, no action needed'
      });
    }
    
    user.gameSaves.splice(saveIndex, 1);
    await user.save();
    
    console.log(`Server successfully deleted save ${id} for user ${user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Game save deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /game/save/:id route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/game/save/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'No save ID provided' });
    }
    
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() !== req.user._id.toString()) {
      console.error(`Security violation: User ${req.user._id} attempted to access save for user ${user._id}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access to user saves'
      });
    }
    
    if (!user.gameSaves) {
      user.gameSaves = [];
    }
    
    const save = user.gameSaves.find(save => save.id === id);
    
    if (!save) {
      console.log(`Save ID ${id} not found in user's saves collection`);
      return res.status(404).json({
        success: false,
        message: 'Save not found'
      });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    console.log(`Server successfully loaded save ${id} for user ${user._id}`);
    
    res.status(200).json({
      success: true,
      gameData: save.data,
      lastSave: new Date(save.timestamp),
      message: 'Game save loaded successfully'
    });
  } catch (error) {
    console.error('Error in GET /game/save/:id route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/game/load', auth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() !== req.user._id.toString()) {
      console.error(`Security violation: User ${req.user._id} attempted to access data for user ${user._id}`);
      return res.status(403).json({ success: false, message: 'Unauthorized access to user data' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      gameData: user.gameData || null,
      lastSave: user.lastSave || null
    });
  } catch (error) {
    console.error('Error in /game/load route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      user: {
        ...user.toProfile(),
        lastLogin: user.lastLogin,
        lastSave: user.lastSave,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error in GET /profile route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await findUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const profileSettings = user.profileSettings || { visibility: 'public' };
    
    if (profileSettings.visibility === 'private') {
      return res.status(403).json({ 
        success: false, 
        message: 'This profile is private',
        isPrivate: true
      });
    }
    
    let publicGameData = null;
    if (user.gameData) {
      const { playerName, day, level, happiness, grid, neighbors } = user.gameData;
      
      const buildingCount = grid ? grid.filter(b => b !== null).length : 0;
      const neighborCount = neighbors ? neighbors.filter(n => n.hasHome).length : 0;
      const totalIncome = grid ? grid.reduce((sum, b) => sum + (b && b.income ? b.income : 0), 0) : 0;
      
      publicGameData = {
        playerName,
        day,
        level,
        happiness,
        stats: {
          buildingCount,
          neighborCount,
          totalIncome,
          happiness
        },
        lastActive: user.lastSave || user.lastLogin
      };
      
      if (profileSettings.showStats) {
        publicGameData.grid = grid;
      }
    }
    
    res.status(200).json({
      success: true,
      profile: {
        username: user.username,
        createdAt: user.createdAt,
        lastActive: user.lastSave || user.lastLogin,
        gameData: publicGameData,
        showBio: profileSettings.showBio || false,
        showStats: profileSettings.showStats || false,
        showActivity: profileSettings.showActivity || false
      }
    });
  } catch (error) {
    console.error('Error in GET /profile/:username route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/profile/settings', auth, async (req, res) => {
  try {
    const { profileSettings } = req.body;
    
    if (!profileSettings) {
      return res.status(400).json({ success: false, message: 'No profile settings provided' });
    }
    
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.profileSettings = {
      ...user.profileSettings,
      ...profileSettings
    };
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile settings updated successfully',
      profileSettings: user.profileSettings
    });
  } catch (error) {
    console.error('Error in PUT /profile/settings route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const { sort = 'level', limit = 10, page = 1 } = req.query;
    
    const validSortFields = ['level', 'happiness', 'buildingCount', 'day'];
    const sortField = validSortFields.includes(sort) ? sort : 'level';
    
    const numLimit = parseInt(limit, 10) || 10;
    const numPage = parseInt(page, 10) || 1;
    const skip = (numPage - 1) * numLimit;
    
    const pipeline = [
      { $match: { 
        gameData: { $exists: true, $ne: null },
        'profileSettings.visibility': { $ne: 'private' }
      }},
      { $project: {
        username: 1,
        'gameData.playerName': 1,
        'gameData.level': 1,
        'gameData.happiness': 1,
        'gameData.day': 1,
        'gameData.grid': 1,
        lastSave: 1,
        lastLogin: 1,
        buildingCount: { 
          $size: { 
            $filter: { 
              input: '$gameData.grid', 
              as: 'building', 
              cond: { $ne: ['$$building', null] } 
            } 
          } 
        }
      }},
      { $sort: { [`gameData.${sortField === 'buildingCount' ? 'buildingCount' : sortField}`]: -1 } },
      { $skip: skip },
      { $limit: numLimit }
    ];
    
    const leaderboard = await User.aggregate(pipeline);
    
    const totalUsers = await User.countDocuments({ 
      gameData: { $exists: true, $ne: null },
      'profileSettings.visibility': { $ne: 'private' }
    });
    
    res.status(200).json({
      success: true,
      leaderboard: leaderboard.map(user => ({
        username: user.username,
        playerName: user.gameData?.playerName || user.username,
        level: user.gameData?.level || 1,
        happiness: user.gameData?.happiness || 0,
        day: user.gameData?.day || 1,
        buildingCount: user.buildingCount || 0,
        lastActive: user.lastSave || user.lastLogin
      })),
      pagination: {
        total: totalUsers,
        page: numPage,
        limit: numLimit,
        pages: Math.ceil(totalUsers / numLimit)
      }
    });
  } catch (error) {
    console.error('Error in GET /leaderboard route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/check-registered', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { email } = req.body;
    
    const user = await findUserByEmail(email);
    
    return res.status(200).json({
      success: true,
      exists: !!user,
      registered: !!user
    });
  } catch (error) {
    console.error('Error in /check-registered route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/game/saves', auth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (user._id.toString() !== req.user._id.toString()) {
      console.error(`Security violation: User ${req.user._id} attempted to access saves for user ${user._id}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access to user saves'
      });
    }
    
    if (!user.gameSaves || !Array.isArray(user.gameSaves)) {
      return res.status(200).json({
        success: true,
        saves: []
      });
    }
    
    res.status(200).json({
      success: true,
      saves: user.gameSaves.map(save => ({
        id: save.id,
        playerName: save.playerName || 'Unknown',
        data: save.data,
        timestamp: save.timestamp || Date.now(),
        saveType: save.saveType || 'manual',
        version: save.version || '1.0'
      }))
    });
  } catch (error) {
    console.error('Error in GET /game/saves route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/update-username', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { email, username } = req.body;
    
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username already taken' });
    }
    
    let user = await findUserByEmail(email);
    let isNewUser = false;
    
    if (!user) {
      isNewUser = true;
      user = await createUser(email, username);
      console.log(`Created new user with email ${email} and username ${username}`);
    } else {
      await updateUser(user._id, { username });
      console.log(`Updated username for ${email} to ${username}`);
    }
    
    const session = await createSession(user, req.headers['user-agent'] || 'Unknown', req.ip);
    const token = setAuthCookie(res, user._id);
    
    const updatedUser = await findUserById(user._id);
    
    res.status(200).json({
      success: true,
      message: isNewUser ? 'User created successfully' : 'Username updated successfully',
      token,
      user: updatedUser.toProfile(),
      isNewUser
    });
  } catch (error) {
    console.error('Error in /update-username route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/auth-check', async (req, res) => {
  try {
    console.log('Auth check request received');
    console.log('Request cookies:', req.cookies);
    
    let token = req.cookies.neighborville_auth;
    
    console.log('Token from cookies:', token ? `${token.substring(0, 15)}...` : 'No token');
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('Token from Authorization header:', token ? `${token.substring(0, 15)}...` : 'No token');
      }
    }
    
    if (!token) {
      return res.status(200).json({ 
        success: false, 
        authenticated: false,
        message: 'No authentication token found' 
      });
    }
    
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(200).json({ 
        success: false, 
        authenticated: false,
        message: 'Invalid or expired token' 
      });
    }
    
    console.log('Token verified for user ID:', decoded.userId);
    
    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(200).json({ 
        success: false, 
        authenticated: false,
        message: 'User not found' 
      });
    }
    
    console.log('User found:', user.username || user.email);
    console.log('User has saves:', user.gameSaves ? user.gameSaves.length : 0);
    
    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        verified: user.verified
      },
      hasSaves: user.gameSaves && user.gameSaves.length > 0,
      saveCount: user.gameSaves ? user.gameSaves.length : 0,
      lastSave: user.lastSave
    });
  } catch (error) {
    console.error('Error in /auth-check route:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/legal-acceptance', auth, [
  body('termsOfService').optional().isBoolean().withMessage('Terms of Service acceptance must be boolean'),
  body('privacyPolicy').optional().isBoolean().withMessage('Privacy Policy acceptance must be boolean'),
  body('marketingConsent').optional().isBoolean().withMessage('Marketing consent must be boolean'),
  body('version').optional().isString().withMessage('Version must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { termsOfService, privacyPolicy, marketingConsent, version = '1.0.0' } = req.body;
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updateFields = {};
    const currentTime = new Date();

    if (termsOfService !== undefined) {
      updateFields['legalAcceptance.termsOfService.accepted'] = termsOfService;
      updateFields['legalAcceptance.termsOfService.version'] = version;
      updateFields['legalAcceptance.termsOfService.acceptedAt'] = termsOfService ? currentTime : null;
      updateFields['legalAcceptance.termsOfService.ipAddress'] = termsOfService ? ipAddress : null;
    }

    if (privacyPolicy !== undefined) {
      updateFields['legalAcceptance.privacyPolicy.accepted'] = privacyPolicy;
      updateFields['legalAcceptance.privacyPolicy.version'] = version;
      updateFields['legalAcceptance.privacyPolicy.acceptedAt'] = privacyPolicy ? currentTime : null;
      updateFields['legalAcceptance.privacyPolicy.ipAddress'] = privacyPolicy ? ipAddress : null;
    }

    if (marketingConsent !== undefined) {
      updateFields['legalAcceptance.marketingConsent.accepted'] = marketingConsent;
      updateFields['legalAcceptance.marketingConsent.acceptedAt'] = marketingConsent ? currentTime : null;
      updateFields['legalAcceptance.marketingConsent.ipAddress'] = marketingConsent ? ipAddress : null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Failed to update user' });
    }

    res.json({
      success: true,
      message: 'Legal acceptance updated successfully',
      legalAcceptance: updatedUser.legalAcceptance
    });

  } catch (error) {
    console.error('Error updating legal acceptance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/legal-acceptance', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await findUserById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      legalAcceptance: user.legalAcceptance || {
        termsOfService: { accepted: false },
        privacyPolicy: { accepted: false },
        marketingConsent: { accepted: false }
      }
    });

  } catch (error) {
    console.error('Error fetching legal acceptance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router; 