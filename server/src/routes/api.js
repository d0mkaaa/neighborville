import express from 'express';
import { auth } from '../middleware/auth.js';
import { checkSuspensionForGame } from '../middleware/suspensionCheck.js';
import { findUserById } from '../services/userService.js';
import saveService from '../services/saveService.js';
import gameInitService from '../services/gameInitializationService.js';
import { execSync } from 'child_process';
import fs from 'fs';

const router = express.Router();

router.post('/user/game/initialize', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const { playerName, neighborhoodName } = req.body;
    
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Player name is required'
      });
    }
    
    const hasExisting = await gameInitService.hasExistingSaves(req.user._id);
    
    if (hasExisting) {
      return res.status(409).json({
        success: false,
        message: 'User already has existing game data'
      });
    }
    
    const result = await gameInitService.initializeNewGame(
      req.user._id, 
      playerName, 
      neighborhoodName || 'My City', 
      req
    );
    
    return res.json({
      success: result.success,
      gameData: result.gameData,
      saveId: result.saveId,
      message: result.message
    });
    
  } catch (error) {
    console.error('Game initialization error:', error);
    
    if (error.message.includes('name')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize game'
    });
  }
});

router.get('/user/game/start', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const result = await gameInitService.getStartingGameState(req.user._id, req);
    
    return res.json({
      success: result.success,
      gameData: result.gameData,
      isExisting: result.isExisting,
      saveId: result.saveId,
      message: result.message
    });
    
  } catch (error) {
    console.error('Get starting game state error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get game state'
    });
  }
});

router.post('/user/game/active-save/:id', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing save ID' 
      });
    }
    
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const save = user.gameSaves.find(s => s.id === id);
    
    if (!save) {
      return res.status(404).json({ 
        success: false, 
        message: 'Save not found' 
      });
    }
    
    user.activeGameSave = save;
    user.lastSave = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Active save set successfully'
    });
  } catch (error) {
    console.error('Error setting active save:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const fetchLatestGitHubCommit = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/d0mkaaa/neighborville/commits/main');
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    
    const commit = await response.json();
    return {
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url
    };
  } catch (error) {
    console.warn('Failed to fetch from GitHub API:', error.message);
    return null;
  }
};

const generateVersionFromCommit = (commitDate, isLatest = true) => {
  const now = new Date();
  const commitDateObj = new Date(commitDate);
  const daysSinceCommit = Math.floor((now - commitDateObj) / (1000 * 60 * 60 * 24));
  
  const major = 0;
  const minor = 10;
  const patch = isLatest ? 0 : daysSinceCommit;
  
  return `${major}.${minor}.${patch}-beta`;
};

router.get('/version', async (req, res) => {
  try {
    let versionInfo = {
      version: '0.10.0-beta',
      commit: 'unknown',
      branch: 'main',
      buildDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      isLive: false,
      lastUpdate: null,
      githubUrl: 'https://github.com/d0mkaaa/neighborville'
    };

    const githubCommit = await fetchLatestGitHubCommit();
    if (githubCommit) {
      versionInfo = {
        ...versionInfo,
        version: generateVersionFromCommit(githubCommit.date, true),
        commit: githubCommit.shortSha,
        buildDate: githubCommit.date,
        isLive: true,
        lastUpdate: githubCommit.date,
        commitMessage: githubCommit.message,
        commitAuthor: githubCommit.author,
        commitUrl: githubCommit.url
      };
    } else {
      try {
        const { execSync } = await import('child_process');
        const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        const commitDate = execSync('git log -1 --format=%ci', { encoding: 'utf8' }).trim();
        
        versionInfo.commit = commit.substring(0, 7);
        versionInfo.branch = branch;
        versionInfo.buildDate = new Date(commitDate).toISOString();
        versionInfo.version = generateVersionFromCommit(commitDate);
        versionInfo.isLive = false;
      } catch (gitError) {
        console.warn('Local git information not available:', gitError.message);
        versionInfo.version = '0.10.0-beta';
        versionInfo.commit = 'fallback';
      }
    }

    res.json({
      success: true,
      versionInfo
    });
  } catch (error) {
    console.error('Error getting version info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get version information',
      versionInfo: {
        version: '0.10.0-beta',
        commit: 'error',
        branch: 'main',
        buildDate: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        isLive: false
      }
    });
  }
});

const fetchGitHubCommits = async (limit = 10) => {
  try {
    const response = await fetch(`https://api.github.com/repos/d0mkaaa/neighborville/commits?per_page=${limit}`);
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    
    const commits = await response.json();
    return commits.map((commit, index) => {
      const commitDate = new Date(commit.commit.author.date);
      const version = generateVersionFromCommit(commit.commit.author.date, index === 0);
      
      const message = commit.commit.message.toLowerCase();
      let changeType = 'improvement';
      let updateType = 'patch';
      
      if (message.includes('fix') || message.includes('bug')) {
        changeType = 'bugfix';
      } else if (message.includes('feat') || message.includes('add') || message.includes('new')) {
        changeType = 'feature';
        updateType = 'minor';
      } else if (message.includes('security') || message.includes('secure')) {
        changeType = 'security';
      } else if (message.includes('break') || message.includes('major')) {
        updateType = 'major';
      }
      
      const title = commit.commit.message.split('\n')[0];
      const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
      
      return {
        id: `v${version}`,
        version: version,
        date: commit.commit.author.date,
        title: formattedTitle || 'Code Update',
        description: commit.commit.message.split('\n').slice(1).join(' ').trim() || 'Latest improvements and fixes.',
        type: updateType,
        commit: commit.sha,
        author: commit.commit.author.name,
        commitUrl: commit.html_url,
        isLive: true,
        changes: [
          {
            type: changeType,
            description: commit.commit.message.split('\n')[0] || 'Code improvements'
          }
        ]
      };
    });
  } catch (error) {
    console.warn('Failed to fetch GitHub commits:', error.message);
    return null;
  }
};

router.get('/updates', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const liveUpdates = await fetchGitHubCommits(limit);
    
    let updates;
    if (liveUpdates && liveUpdates.length > 0) {
      updates = liveUpdates;
    } else {
      updates = [
        {
          id: 'v0.10.0-beta',
          version: '0.10.0-beta',
          date: new Date().toISOString(),
          title: 'Complete Site Overhaul with Live GitHub Integration',
          description: 'Major update including suspension system overhaul, admin panel improvements, tutorial fixes, and live GitHub version integration.',
          type: 'major',
          commit: 'latest',
          author: 'domkaa',
          isLive: false,
          changes: [
            {
              type: 'feature',
              description: 'Unified suspension system with IP suspension options'
            },
            {
              type: 'improvement',
              description: 'Enhanced admin panel with better user management'
            },
            {
              type: 'bugfix',
              description: 'Removed happiness references from tutorial system'
            },
            {
              type: 'feature',
              description: 'Live GitHub integration for real-time version tracking'
            },
            {
              type: 'improvement',
              description: 'Improved authentication and security systems'
            }
          ]
        },
        {
          id: 'v0.9.1-beta',
          version: '0.9.1-beta',
          date: '2025-06-08T21:57:19Z',
          title: 'Production Deployment & Critical Fixes',
          description: 'Major production update with critical bug fixes and performance improvements.',
          type: 'minor',
          commit: '070e1aa5604e2861dc0000c09602fc88e83f8b88',
          author: 'domkaa',
          isLive: false,
          changes: [
            {
              type: 'bugfix',
              description: 'Fixed critical production deployment issues'
            },
            {
              type: 'improvement',
              description: 'Enhanced server stability and performance'
            },
            {
              type: 'bugfix',
              description: 'Resolved authentication edge cases'
            },
            {
              type: 'security',
              description: 'Improved security measures for production environment'
            }
          ]
        }
      ];
    }

    res.json({
      success: true,
      updates: updates.slice(0, limit)
    });
  } catch (error) {
    console.error('Error getting updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get update logs'
    });
  }
});

router.post('/user/game/save', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const { gameData, saveType = 'manual' } = req.body;
    
    if (!gameData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing game data' 
      });
    }
    
    const result = await saveService.saveGame(req.user._id, gameData, saveType, req);
    
    return res.json({
      success: true,
      saveId: result.saveId,
      timestamp: result.timestamp,
      message: result.message
    });
    
  } catch (error) {
    console.error('Save operation error:', error);
    
    if (error.message.includes('validation')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('conflict') || error.message.includes('in progress')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Save operation failed'
    });
  }
});

router.get('/user/game/load', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const result = await saveService.getLatestSave(req.user._id, req);
    
    return res.json({
      success: result.success,
      gameData: result.gameData,
      lastSave: result.lastSave,
      saveId: result.saveId
    });
  } catch (error) {
    console.error('Error loading game:', error);
    return res.status(500).json({
      success: false,
      message: 'Error loading game'
    });
  }
});

router.get('/user/game/save/:saveId', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const { saveId } = req.params;
    const result = await saveService.loadSave(req.user._id, saveId, req);
    
    return res.json({
      success: result.success,
      gameData: result.gameData,
      lastSave: result.lastSave,
      saveId: result.saveId,
      message: result.message
    });
  } catch (error) {
    console.error('Error loading specific save:', error);
    return res.status(500).json({
      success: false,
      message: 'Error loading save'
    });
  }
});

router.get('/user/game/saves', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const result = await saveService.getAllSaves(req.user._id, req);
    
    return res.json({
      success: result.success,
      saves: result.saves
    });
  } catch (error) {
    console.error('Error getting saves:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting saves'
    });
  }
});

router.delete('/user/game/save/:saveId', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const { saveId } = req.params;
    const result = await saveService.deleteSave(req.user._id, saveId, req);
    
    return res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error deleting save:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting save'
    });
  }
});

export default router; 