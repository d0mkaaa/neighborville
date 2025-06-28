import User from '../models/User.js';
import express from 'express';
import { body, validationResult } from 'express-validator';
import { auth, optionalAuth } from '../middleware/cookieAuth.js';
import { findUserByUsername, findUserById } from '../services/userService.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    let totalBuildings = 0;
    let lastActiveDate = null;
    let memberSince = user.createdAt;
    let citiesBuilt = user.gameSaves ? user.gameSaves.length : 0;
    
    if (user.gameData && user.gameData.grid) {
      totalBuildings = user.gameData.grid.filter(building => building !== null).length;
    }
    
    if (user.lastSave || user.lastLogin) {
      lastActiveDate = user.lastSave || user.lastLogin;
    }
    
    res.status(200).json({
      success: true,
      user: {
        ...user.toProfile(),
        lastLogin: user.lastLogin,
        lastSave: user.lastSave,
        createdAt: user.createdAt,
        stats: {
          citiesBuilt,
          totalBuildings,
          lastActive: lastActiveDate,
          memberSince
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /profile route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:username', async (req, res) => {
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
    
    let extendedProfileData = null;
    if (profileSettings.showBio && user.extendedProfile) {
      extendedProfileData = {
        bio: user.extendedProfile.bio || null,
        location: user.extendedProfile.location || null,
        website: user.extendedProfile.website || null,
        socialLinks: user.extendedProfile.socialLinks || null,
        interests: user.extendedProfile.interests || [],
        gamePreferences: user.extendedProfile.gamePreferences || null
      };
    }

    res.status(200).json({
      success: true,
      profile: {
        username: user.username,
        createdAt: user.createdAt,
        lastActive: user.lastSave || user.lastLogin,
        gameData: publicGameData,
        extendedProfile: extendedProfileData,
        showBio: profileSettings.showBio || false,
        showStats: profileSettings.showStats || false,
        showActivity: profileSettings.showActivity || false,
        showSocialLinks: profileSettings.showSocialLinks || false,
        showAchievements: profileSettings.showAchievements || false
      }
    });
  } catch (error) {
    console.error('Error in GET /profile/:username route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/settings', auth, async (req, res) => {
  try {
    const { profileSettings, extendedProfile } = req.body;
    
    if (!profileSettings && !extendedProfile) {
      return res.status(400).json({ success: false, message: 'No profile data provided' });
    }

    
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (profileSettings) {
      user.profileSettings = {
        ...user.profileSettings,
        ...profileSettings
      };
    }

    if (extendedProfile) {
      user.extendedProfile = {
        ...user.extendedProfile,
        ...extendedProfile
      };
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profileSettings: user.profileSettings,
      extendedProfile: user.extendedProfile,
      profileCompletion: user.calculateProfileCompletion()
    });
  } catch (error) {
    console.error('Error in PUT /profile/settings route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/search/users', async (req, res) => {
  try {
    const { 
      q = '', 
      filter = 'all', 
      sort = 'relevance', 
      limit = 20, 
      page = 1 
    } = req.query;
    
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;
    
    let searchQuery = {};
    let sortQuery = {};
    
    if (q && q.trim()) {
      searchQuery.$or = [
        { username: { $regex: q.trim(), $options: 'i' } },
        { 'gameData.playerName': { $regex: q.trim(), $options: 'i' } }
      ];
    }
    
    const now = new Date();
    const onlineThreshold = new Date(now.getTime() - 15 * 60 * 1000);
    const recentThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const newUserThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    switch (filter) {
      case 'online':
        searchQuery.lastLogin = { $gte: onlineThreshold };
        break;
      case 'recent':
        searchQuery.$or = [
          { lastLogin: { $gte: recentThreshold } },
          { lastSave: { $gte: recentThreshold } }
        ];
        break;
      case 'new':
        searchQuery.createdAt = { $gte: newUserThreshold };
        break;
      case 'experienced':
        searchQuery.$or = [
          { 'gameData.level': { $gte: 10 } },
          { 'gameData.day': { $gte: 30 } }
        ];
        break;
    }
    
    searchQuery['profileSettings.visibility'] = { $ne: 'private' };
    
    switch (sort) {
      case 'level':
        sortQuery = { 'gameData.level': -1, 'gameData.day': -1 };
        break;
      case 'buildings':
        sortQuery = { 'gameData.buildingCount': -1 };
        break;
      case 'rating':
        sortQuery = { 'gameData.happiness': -1 };
        break;
      case 'activity':
        sortQuery = { lastSave: -1, lastLogin: -1 };
        break;
      case 'name':
        sortQuery = { username: 1 };
        break;
      default:
        if (q && q.trim()) {
          sortQuery = { lastSave: -1, lastLogin: -1 };
        } else {
          sortQuery = { lastSave: -1, lastLogin: -1 };
        }
    }
    
    const users = await User.find(searchQuery)
      .select('username gameData createdAt lastLogin lastSave profileSettings extendedProfile')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    const total = await User.countDocuments(searchQuery);
    
    const results = users.map(user => {
      const gameData = user.gameData || {};
      const buildingCount = gameData.grid ? gameData.grid.filter(b => b !== null).length : 0;
      const neighborCount = gameData.neighbors ? gameData.neighbors.filter(n => n.hasHome).length : 0;
      
      const lastActive = user.lastSave || user.lastLogin || user.createdAt;
      const isOnline = lastActive && (new Date() - new Date(lastActive)) < 15 * 60 * 1000;
      
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: gameData.playerName || user.username,
        location: user.extendedProfile?.location || null,
        level: gameData.level || 1,
        buildings: buildingCount,
        neighbors: neighborCount,
        rating: Math.min(5, (gameData.happiness || 0) / 20),
        lastActive: lastActive ? new Date(lastActive).toISOString() : new Date(user.createdAt).toISOString(),
        isOnline,
        interests: user.extendedProfile?.interests || [],
        gamePreferences: {
          favoriteBuilding: user.extendedProfile?.favoriteBuilding || null,
          playStyle: user.extendedProfile?.playStyle || null
        }
      };
    });
    
    res.status(200).json({
      success: true,
      results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error in profile search route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router; 