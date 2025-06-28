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
import { checkSuspensionForGame } from '../middleware/suspensionCheck.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { logger } from '../utils/logger.js';
import { getRealIP } from '../utils/ipUtils.js';



class ContentModerationService {
  static PROHIBITED_WORDS = [
    'nigger', 'nigga', 'jigaboo', 'wetback', 'raghead', 'towelhead', 'beaner',
    'nazi', 'hitler',
    'kill yourself', 'kys', 'go die', 'death threat',
    
    'sex', 'sexual', 'sexy', 'porn', 'nude', 'naked', 'erotic', 'orgasm', 'masturbate',
    'blowjob', 'handjob', 'hardcore', 'xxx', 'adult content',
    
    'penis', 'vagina', 'breast', 'nipple', 'cock', 'pussy',
    
    'click here for free', 'get rich quick', 'mlm opportunity', 'pyramid scheme',
    'buy now limited time', 'act fast money', 'earn money fast',
    
    'credit card number', 'social security number', 'bank account number', 'password123'
  ];

  static ALLOWED_WORDS = [
    'dom', 'domka', 'nick', 'dick', 'cox', 'wang', 'long', 'wood', 'johnson',
    'gay', 'lesbian', 'trans', 'transgender', 'queer', 'bisexual',
    
    'ass', 'hell', 'damn', 'crap', 'piss'
  ];

  static SUSPICIOUS_PATTERNS = [
    /\bn[i1!]+gg[e3@]+r\b/i,
    /\bn[i1!]+gg[a@4]+\b/i,
    /\bh[i1!]+tl[e3@]+r\b/i,
    /\bn[a@4]+z[i1!]+\b/i,
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/,
    /\b(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?\b/i,
    /(.)\1{6,}/,
    /\b(sex|porn|xxx|nude|naked)\s*(chat|cam|video|pic|photo)\b/i,
    /\b(hot|sexy|horny)\s*(girl|boy|woman|man|teen)\b/i,
  ];

  static moderateContent(text) {
    if (!text || typeof text !== 'string') {
      return { isValid: true };
    }

    const originalText = text.trim();
    let cleanedText = originalText;
    const flaggedWords = [];
    const flaggedPatterns = [];
    const detectedItems = [];
    
    const lowerText = originalText.toLowerCase();
    
    if (originalText.length > 1000) {
      return {
        isValid: false,
        reason: 'Content is too long. Please keep it under 1000 characters.',
        severity: 'moderate',
        cleanedText: originalText.substring(0, 1000) + '...',
        detectedItems: ['content too long']
      };
    }

    for (const word of this.PROHIBITED_WORDS) {
      const lowerWord = word.toLowerCase();
      
      if (this.ALLOWED_WORDS.includes(lowerWord)) continue;
      
      let wordRegex;
      if (word.length <= 3) {
        word
        wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      }
      
      if (wordRegex.test(lowerText)) {
        const matches = Array.from(lowerText.matchAll(wordRegex));
        let isActualViolation = false;
        
        for (const match of matches) {
          const matchedWord = match[0];
          const startIndex = match.index;
          const endIndex = startIndex + matchedWord.length;
          
          const beforeChar = startIndex > 0 ? lowerText[startIndex - 1] : ' ';
          const afterChar = endIndex < lowerText.length ? lowerText[endIndex] : ' ';
          
          if (!/[a-z]/.test(beforeChar) && !/[a-z]/.test(afterChar)) {
            isActualViolation = true;
            break;
          }
        }
        
        if (isActualViolation) {
          flaggedWords.push(word);
          detectedItems.push(`inappropriate word: "${word}"`);
          
          cleanedText = cleanedText.replace(wordRegex, '***');
        }
      }
    }

    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      const matches = Array.from(originalText.matchAll(new RegExp(pattern.source, pattern.flags + 'g')));
      
      if (matches.length > 0) {
        matches.forEach(match => {
          flaggedPatterns.push(match[0]);
          detectedItems.push(`suspicious pattern: "${match[0]}"`);
          
          cleanedText = cleanedText.replace(match[0], '*'.repeat(match[0].length));
        });
      }
    }

    if (flaggedWords.length > 0 || flaggedPatterns.length > 0) {
      cleanedText = cleanedText.replace(/\*+/g, '***').replace(/\s+/g, ' ').trim();

        return {
          isValid: false,
        reason: flaggedWords.length > 0 
          ? `Content contains inappropriate language: ${flaggedWords.join(', ')}`
          : 'Content contains suspicious patterns that aren\'t allowed',
        severity: flaggedWords.length > 0 ? 'high' : 'moderate',
        flaggedWords: flaggedWords,
        flaggedPatterns: flaggedPatterns,
        cleanedText: cleanedText,
        detectedItems: detectedItems
        };
    }

    const capsCount = (originalText.match(/[A-Z]/g) || []).length;
    const totalChars = originalText.replace(/\s/g, '').length;
    if (totalChars > 15 && capsCount / totalChars > 0.8) {
      return {
        isValid: false,
        reason: 'Please don\'t use excessive capital letters.',
        severity: 'low',
        cleanedText: originalText.toLowerCase(),
        detectedItems: ['excessive capital letters']
      };
    }

    const words = lowerText.split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 10 && uniqueWords.size / words.length < 0.3) {
      return {
        isValid: false,
        reason: 'Content appears to be repetitive or spam-like.',
        severity: 'moderate',
        detectedItems: ['repetitive content']
      };
    }

    return { isValid: true };
  }

  static async logModerationAction(userId, content, reason, severity) {
    console.log(`MODERATION: User ${userId} - ${severity} - ${reason}`, {
      content: content.substring(0, 100),
      timestamp: new Date().toISOString()
    });
    
    /*
    await ModerationLog.create({
      userId: userId,
      content: content.substring(0, 500),
      reason: reason,
      severity: severity,
      action: 'blocked',
      timestamp: new Date(),
      moderatedBy: 'system'
    });
    */
  }

  static async getContentRiskLevel(text) {
    const moderation = this.moderateContent(text);
    if (!moderation.isValid) {
      switch (moderation.severity) {
        case 'high': return 'high-risk';
        case 'moderate': return 'medium-risk';
        case 'low': return 'low-risk';
        default: return 'unknown-risk';
      }
    }
    return 'safe';
  }

  static async getUserModerationHistory(userId) {
    console.log(`Getting moderation history for user: ${userId}`);
    return [];
  }
}

const router = express.Router();

router.get('/suspension-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('suspensions.issuedBy', 'username');
    
    if (!user.isSuspended()) {
      return res.status(200).json({
        success: true,
        suspended: false,
        message: 'Account is active'
      });
    }

    const activeSuspension = user.suspensions.find(s => s.isActive);
    const timeRemaining = new Date(activeSuspension.endDate) - new Date();
    
    const existingAppeal = user.appeals.find(a => 
      a.suspensionId.toString() === activeSuspension._id.toString()
    );
    
    res.status(200).json({
      success: true,
      suspended: true,
      suspension: {
        id: activeSuspension._id,
        reason: activeSuspension.reason,
        startDate: activeSuspension.startDate,
        endDate: activeSuspension.endDate,
        issuedBy: activeSuspension.issuedBy?.username || 'System',
        timeRemaining: Math.max(0, timeRemaining),
        isPermanent: timeRemaining > (365 * 24 * 60 * 60 * 1000),
        canAppeal: !existingAppeal || existingAppeal.status === 'denied',
        appeal: existingAppeal || null
      }
    });
  } catch (error) {
    console.error('Error checking suspension status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking suspension status'
    });
  }
});

router.post('/appeal-suspension', auth, async (req, res) => {
  try {
    const { suspensionId, reason } = req.body;
    
    if (!suspensionId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Suspension ID and reason are required'
      });
    }
    
    if (reason.length < 20 || reason.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Appeal reason must be between 20 and 1000 characters'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    const suspension = user.suspensions.find(s => 
      s._id.toString() === suspensionId && s.isActive
    );
    
    if (!suspension) {
      return res.status(404).json({
        success: false,
        message: 'Active suspension not found'
      });
    }
    
    const existingAppeal = user.appeals.find(a => 
      a.suspensionId.toString() === suspensionId
    );
    
    if (existingAppeal && existingAppeal.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending appeal for this suspension'
      });
    }
    
    if (existingAppeal && existingAppeal.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This suspension has already been successfully appealed'
      });
    }
    
    const moderation = ContentModerationService.moderateContent(reason);
    if (!moderation.isValid) {
      await ContentModerationService.logModerationAction(
        user._id,
        reason,
        moderation.reason,
        moderation.severity || 'unknown'
      );
      
      return res.status(400).json({
        success: false,
        message: 'Appeal contains inappropriate content',
        reason: moderation.reason
      });
    }
    
    user.appeals.push({
      suspensionId: suspensionId,
      reason: reason,
      status: 'pending',
      submittedAt: new Date()
    });
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Appeal submitted successfully. An admin will review it shortly.',
      appeal: user.appeals[user.appeals.length - 1]
    });
    
  } catch (error) {
    console.error('Error submitting appeal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting appeal'
    });
  }
});

router.get('/appeals', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('appeals.reviewedBy', 'username')
      .populate('suspensions.issuedBy', 'username');
    
    const appealsWithSuspensionInfo = user.appeals.map(appeal => {
      const suspension = user.suspensions.find(s => 
        s._id.toString() === appeal.suspensionId.toString()
      );
      
      return {
        ...appeal.toObject(),
        suspension: suspension ? {
          reason: suspension.reason,
          startDate: suspension.startDate,
          endDate: suspension.endDate,
          issuedBy: suspension.issuedBy?.username || 'System'
        } : null
      };
    });
    
    res.status(200).json({
      success: true,
      appeals: appealsWithSuspensionInfo
    });
    
  } catch (error) {
    console.error('Error fetching appeals:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appeals'
    });
  }
});

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
      const moderation = ContentModerationService.moderateContent(username);
      if (!moderation.isValid) {
        await ContentModerationService.logModerationAction(
          email,
          username, 
          moderation.reason, 
          moderation.severity || 'unknown'
        );
        
        return res.status(400).json({ 
          success: false, 
          message: 'Username not allowed',
          reason: moderation.reason 
        });
      }
      
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

router.post('/check-2fa-status', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors in check-2fa-status:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address',
        errors: errors.array() 
      });
    }

    const { email } = req.body;
    
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: 'New user - account will be created',
        has2FA: false,
        isNewUser: true,
        verified: false
      });
    }

    const has2FA = user.twoFactorAuth.enabled && user.twoFactorAuth.setupCompleted;
    
    const needsUsernameUpdate = user.username.includes('@');
    
    res.status(200).json({
      success: true,
      has2FA: has2FA,
      isNewUser: false,
      verified: user.verified,
      userId: user._id.toString(),
      username: user.username,
      needsUsernameUpdate: needsUsernameUpdate
    });
  } catch (error) {
    console.error('Error in /check-2fa-status route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/update-username', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('newUsername').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, newUsername } = req.body;
    
    const moderation = ContentModerationService.moderateContent(newUsername);
    if (!moderation.isValid) {
      await ContentModerationService.logModerationAction(
        email,
        newUsername, 
        moderation.reason, 
        moderation.severity || 'unknown'
      );
      
      return res.status(400).json({ 
        success: false, 
        message: 'Username contains inappropriate content',
        reason: moderation.reason 
      });
    }
    
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingUser = await findUserByUsername(newUsername);
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    user.username = newUsername;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Username updated successfully',
      username: user.username
    });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/verify-login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('verificationCode').optional().isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
  body('twoFactorToken').optional().isLength({ min: 6, max: 6 }).withMessage('2FA token must be 6 digits'),
  body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, verificationCode, twoFactorToken, username } = req.body;

    let user = await findUserByEmail(email);
    let isNewRegistration = false;

    if (!user && username) {
      const moderation = ContentModerationService.moderateContent(username);
      if (!moderation.isValid) {
        await ContentModerationService.logModerationAction(
          email,
          username, 
          moderation.reason, 
          moderation.severity || 'unknown'
        );
        
        return res.status(400).json({ 
          success: false, 
          message: 'Username contains inappropriate content',
          reason: moderation.reason 
        });
      }
      
      try {
        user = await createUser(email, username, null);
        isNewRegistration = true;
        console.log(`New user created: ${email} with username: ${username}`);
      } catch (createError) {
        if (createError.code === 11000) {
          if (createError.keyPattern?.username) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
          }
          if (createError.keyPattern?.email) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
          }
        }
        throw createError;
      }
    } else if (!user) {
      return res.status(400).json({ success: false, message: 'Account not found' });
    }

    const has2FA = user.twoFactorAuth.enabled && user.twoFactorAuth.setupCompleted;

    if (has2FA && !isNewRegistration) {
      if (!twoFactorToken) {
        return res.status(200).json({
          success: true,
          message: '2FA token required',
          requires2FA: true,
          userId: user._id.toString(),
          skipEmailVerification: true
        });
      }

      const isValidToken = user.verifyTwoFactorToken(twoFactorToken);
      if (!isValidToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid 2FA token',
          requires2FA: true
        });
      }

      if (!user.verified) {
        await markUserVerified(email);
      }
    } else {
      if (!verificationCode) {
        return res.status(400).json({
          success: false,
          message: 'Verification code required'
        });
      }

            logger.debug(`🔍 STARTING verification for ${email} with code ${verificationCode}`);
    const codeVerification = await verifyCode(email, verificationCode);
    logger.debug(`📋 VERIFICATION result:`, codeVerification);
      
      if (!codeVerification.valid) {
        return res.status(400).json({
          success: false,
          message: codeVerification.error || 'Invalid verification code'
        });
      }

      await markUserVerified(email);
    }

    const userAgent = req.headers['user-agent'];
    const ip = getRealIP(req);

    try {
      try {
        if (user.trackIP) {
          await user.trackIP(ip, userAgent);
        }
      } catch (trackError) {
        console.error('Non-critical IP tracking error:', trackError.message);
      }

      try {
        if (user.updateActivityStats) {
          await user.updateActivityStats();
        }
      } catch (statsError) {
        console.error('Non-critical activity stats error:', statsError.message);
      }

    const session = await createSession(user, userAgent, ip);
    const token = setAuthCookie(res, user._id);
      const userProfile = user.toProfile();

    res.status(200).json({
      success: true,
      message: 'Login successful',
        user: userProfile,
      token: token,
      isNewRegistration
    });
    } catch (profileError) {
      console.error('Error during final login steps:', profileError);
      return res.status(500).json({
        success: false,
        message: 'Login verification successful but failed to complete login process'
      });
    }
  } catch (error) {
    console.error('Error in /verify-login route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/login/2fa-verify', [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('token').isLength({ min: 6, max: 8 }).withMessage('Token must be 6-8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { userId, token } = req.body;

    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorAuth.enabled) {
      return res.status(400).json({ success: false, message: '2FA not enabled for this user' });
    }

    let isValidToken = false;

    if (token.length === 8) {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const backupCodeIndex = user.twoFactorAuth.backupCodes.findIndex(code => code === hashedToken);
      
      if (backupCodeIndex !== -1) {
        user.twoFactorAuth.backupCodes.splice(backupCodeIndex, 1);
        await user.save();
        isValidToken = true;
      }
    } else {
      isValidToken = speakeasy.totp.verify({
        secret: user.twoFactorAuth.secret,
        encoding: 'base32',
        token: token,
        window: 1
      });
    }

    if (!isValidToken) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA token' });
    }

    const userAgent = req.get('User-Agent') || 'unknown';
    const ip = getRealIP(req);

    if (user.trackIP) {
      await user.trackIP(ip, userAgent);
    }

    if (user.updateActivityStats) {
      await user.updateActivityStats();
    }

    const session = await createSession(user, userAgent, ip);
    const authToken = setAuthCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: '2FA verification successful',
      user: user.toProfile(),
      token: authToken
    });
  } catch (error) {
    console.error('Error in /login/2fa-verify route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/legal-acceptance', [
  body('termsOfService').optional().isBoolean().withMessage('Terms of Service must be a boolean'),
  body('privacyPolicy').optional().isBoolean().withMessage('Privacy Policy must be a boolean'),
  body('marketingConsent').optional().isBoolean().withMessage('Marketing Consent must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { termsOfService, privacyPolicy, marketingConsent } = req.body;

    const acceptanceData = {
      termsOfService: termsOfService ? {
        accepted: true,
        acceptedAt: new Date(),
        version: '1.0'
      } : undefined,
      privacyPolicy: privacyPolicy ? {
        accepted: true,
        acceptedAt: new Date(),
        version: '1.0'
      } : undefined,
      marketingConsent: marketingConsent ? {
        accepted: true,
        acceptedAt: new Date()
      } : undefined
    };

    res.status(200).json({
      success: true,
      message: 'Legal acceptance updated successfully',
      legalAcceptance: acceptanceData
    });
  } catch (error) {
    console.error('Error in /legal-acceptance route:', error);
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
      const moderation = ContentModerationService.moderateContent(username);
      if (!moderation.isValid) {
        await ContentModerationService.logModerationAction(
          req.user._id,
          username, 
          moderation.reason, 
          moderation.severity || 'unknown'
        );
        
        return res.status(400).json({ 
          success: false, 
          message: 'Username contains inappropriate content',
          reason: moderation.reason 
        });
      }
      
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

router.post('/game/save', auth, checkSuspensionForGame, async (req, res) => {
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

router.post('/game/saves/batch', auth, checkSuspensionForGame, async (req, res) => {
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

router.delete('/game/save/:id', auth, checkSuspensionForGame, async (req, res) => {
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

router.get('/game/save/:id', auth, checkSuspensionForGame, async (req, res) => {
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

router.get('/game/load', auth, checkSuspensionForGame, async (req, res) => {
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


router.post('/neighborhood/save', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const { gameData } = req.body;
    
    if (!gameData) {
      return res.status(400).json({ success: false, message: 'No game data provided' });
    }
    
    if (!gameData.neighborhoodName) {
      gameData.neighborhoodName = 'Unnamed City';
    }
    
    if (!gameData.neighborhoodFoundedDate) {
      gameData.neighborhoodFoundedDate = Date.now();
    }
    
    gameData.lastAutoSave = Date.now();
    
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
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Neighborhood saved successfully',
      lastSave: user.lastSave
    });
  } catch (error) {
    console.error('Error in /neighborhood/save route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/neighborhood/name', auth, async (req, res) => {
  try {
    const { neighborhoodName } = req.body;
    
    if (!neighborhoodName || !neighborhoodName.trim()) {
      return res.status(400).json({ success: false, message: 'Neighborhood name is required' });
    }
    
    if (neighborhoodName.length > 50) {
      return res.status(400).json({ success: false, message: 'Neighborhood name must be 50 characters or less' });
    }
    
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!user.gameData) {
      user.gameData = {
        neighborhoodName: neighborhoodName.trim(),
        neighborhoodFoundedDate: Date.now()
      };
    } else {
      user.gameData.neighborhoodName = neighborhoodName.trim();
    }
    
    user.lastSave = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Neighborhood name updated successfully',
      neighborhoodName: neighborhoodName.trim()
    });
  } catch (error) {
    console.error('Error in PUT /neighborhood/name route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/neighborhood/reset', auth, async (req, res) => {
  try {
    const { newNeighborhoodName } = req.body;
    
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const freshNeighborhoodName = newNeighborhoodName?.trim() || 'New City';
    
    user.gameData = {
      playerName: user.username,
      neighborhoodName: freshNeighborhoodName,
      neighborhoodFoundedDate: Date.now(),
      coins: 500,
      day: 1,
      level: 1,
      experience: 0,
      grid: new Array(25).fill(null),
      gridSize: 25,
      neighborProgress: {},
      completedAchievements: [],
      seenAchievements: [],
      gameTime: 0,
      gameMinutes: 0,
      timeOfDay: 'morning',
      recentEvents: [],
      bills: [],
      energyRate: 2,
      totalEnergyUsage: 0,
      lastBillDay: 0,
      coinHistory: [],
      weather: 'sunny',
      powerGrid: {
        totalPowerProduction: 0,
        totalPowerConsumption: 0,
        connectedBuildings: [],
        powerOutages: []
      },
      waterGrid: {
        totalWaterProduction: 0,
        totalWaterConsumption: 0,
        connectedBuildings: [],
        waterShortages: []
      },
      taxPolicies: [],
      cityBudget: {
        totalRevenue: 0,
        totalExpenses: 0,
        maintenanceCosts: 0,
        taxRevenue: 0,
        buildingIncome: 0,
        balance: 500,
        dailyBalance: 0,
        emergencyFund: 0,
        budgetHealth: 'fair'
      },
      neighborhoodMilestones: [],
      cityEra: 'Early Settlement',
      lastAutoSave: Date.now()
    };
    
    user.lastSave = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Fresh neighborhood started successfully',
      gameData: user.gameData
    });
  } catch (error) {
    console.error('Error in POST /neighborhood/reset route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/neighborhood/load', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() !== req.user._id.toString()) {
      console.error(`Security violation: User ${req.user._id} attempted to access data for user ${user._id}`);
      return res.status(403).json({ success: false, message: 'Unauthorized access to user data' });
    }
    
    if (!user.gameData) {
      const freshNeighborhoodName = 'Unnamed City';
      
      user.gameData = {
        playerName: user.username,
        neighborhoodName: freshNeighborhoodName,
        neighborhoodFoundedDate: Date.now(),
        coins: 500,
        day: 1,
        level: 1,
        experience: 0,
        grid: new Array(25).fill(null),
        gridSize: 25,
        neighborProgress: {},
        completedAchievements: [],
        seenAchievements: [],
        gameTime: 0,
        gameMinutes: 0,
        timeOfDay: 'morning',
        recentEvents: [],
        bills: [],
        energyRate: 2,
        totalEnergyUsage: 0,
        lastBillDay: 0,
        coinHistory: [],
        weather: 'sunny',
        powerGrid: {
          totalPowerProduction: 0,
          totalPowerConsumption: 0,
          connectedBuildings: [],
          powerOutages: []
        },
        waterGrid: {
          totalWaterProduction: 0,
          totalWaterConsumption: 0,
          connectedBuildings: [],
          waterShortages: []
        },
        taxPolicies: [],
        cityBudget: {
          totalRevenue: 0,
          totalExpenses: 0,
          maintenanceCosts: 0,
          taxRevenue: 0,
          buildingIncome: 0,
          balance: 500,
          dailyBalance: 0,
          emergencyFund: 0,
          budgetHealth: 'fair'
        },
        neighborhoodMilestones: [],
        cityEra: 'Early Settlement',
        lastAutoSave: Date.now()
      };
      
      await user.save();
    }
    
    if (!user.gameData.neighborhoodName) {
      user.gameData.neighborhoodName = 'Unnamed City';
      await user.save();
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      gameData: user.gameData,
      lastSave: user.lastSave || null
    });
  } catch (error) {
    console.error('Error in GET /neighborhood/load route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user.toProfile()
    });
  } catch (error) {
    console.error('Error in GET /user/profile route:', error);
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
    const { profileSettings, extendedProfile } = req.body;
    
    if (!profileSettings && !extendedProfile) {
      return res.status(400).json({ success: false, message: 'No profile data provided' });
    }

    const moderationResults = [];

    if (profileSettings?.bio) {
      const moderation = ContentModerationService.moderateContent(profileSettings.bio);
      if (!moderation.isValid) {
        await ContentModerationService.logModerationAction(
          req.user._id, 
          profileSettings.bio, 
          moderation.reason, 
          moderation.severity || 'unknown'
        );
        
        return res.status(400).json({ 
          success: false, 
          message: 'Content moderation failed',
          reason: moderation.reason,
          field: 'bio',
          detectedItems: moderation.detectedItems || [],
          cleanedText: moderation.cleanedText || '',
          flaggedWords: moderation.flaggedWords || [],
          flaggedPatterns: moderation.flaggedPatterns || []
        });
      }
    }

    if (extendedProfile) {
      const fieldsToModerate = [
        { field: 'location', value: extendedProfile.location },
        { field: 'website', value: extendedProfile.website },
        { field: 'twitter', value: extendedProfile.socialLinks?.twitter },
        { field: 'github', value: extendedProfile.socialLinks?.github },
        { field: 'instagram', value: extendedProfile.socialLinks?.instagram },
        { field: 'linkedin', value: extendedProfile.socialLinks?.linkedin }
      ];

      for (const { field, value } of fieldsToModerate) {
        if (value) {
          const moderation = ContentModerationService.moderateContent(value);
          if (!moderation.isValid) {
            await ContentModerationService.logModerationAction(
              req.user._id, 
              value, 
              moderation.reason, 
              moderation.severity || 'unknown'
            );
            
            return res.status(400).json({ 
              success: false, 
              message: 'Content moderation failed',
              reason: moderation.reason,
              field: field,
              detectedItems: moderation.detectedItems || [],
              cleanedText: moderation.cleanedText || '',
              flaggedWords: moderation.flaggedWords || [],
              flaggedPatterns: moderation.flaggedPatterns || []
            });
          }
        }
      }
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

router.post('/admin/make-admin', auth, async (req, res) => {
  try {
    const { targetUsername, secretKey } = req.body;
    
    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'neighborville_admin_2024';
    
    const currentUser = await findUserById(req.user._id);
    if (!currentUser.isAdmin() && secretKey !== ADMIN_SECRET) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized. Only admins can promote users or use the secret key.' 
      });
    }
    
    const targetUser = await findUserByUsername(targetUsername);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    targetUser.role = 'admin';
    targetUser.permissions = ['manage_users', 'moderate_content', 'view_admin_panel'];
    await targetUser.save();
    
    console.log(`User ${targetUser.username} promoted to admin by ${currentUser.username}`);
    
    res.status(200).json({
      success: true,
      message: `User ${targetUsername} has been promoted to admin`,
      user: {
        username: targetUser.username,
        role: targetUser.role,
        permissions: targetUser.permissions
      }
    });
  } catch (error) {
    console.error('Error in admin promotion route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  
  next();
};

router.get('/admin/users', auth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const users = await User.find({})
      .select('username email role verified createdAt lastLogin profileSettings')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      users: users.map(user => ({
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        verified: user.verified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        profileSettings: user.profileSettings
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /admin/users route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/admin/users/:userId/role', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in PUT /admin/users/:userId/role route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/admin/users/:userId/ban', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { banned } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.banned = banned;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      user: {
        id: user._id.toString(),
        username: user.username,
        banned: user.banned
      }
    });
  } catch (error) {
    console.error('Error in PUT /admin/users/:userId/ban route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/admin/moderation-logs', auth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const sampleLogs = [
      {
        id: '1',
        userId: 'sample-user-id',
        username: 'sample-user',
        content: 'Sample inappropriate content that was flagged',
        reason: 'Content contains inappropriate language. Detected: inappropriate, word',
        severity: 'high',
        timestamp: new Date().toISOString(),
        action: 'blocked'
      }
    ];
    
    res.status(200).json({
      success: true,
      logs: sampleLogs,
      pagination: {
        page,
        limit,
        total: sampleLogs.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Error in GET /admin/moderation-logs route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/admin/setup', async (req, res) => {
  try {
    const { email, secretKey } = req.body;
    
    const adminSecretKey = process.env.ADMIN_SETUP_KEY || 'neighborville-admin-setup-2024';
    
    if (secretKey !== adminSecretKey) {
      return res.status(403).json({ success: false, message: 'Invalid secret key' });
    }
    
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.role = 'admin';
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `${user.username || user.email} is now an admin`,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in POST /admin/setup route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/search', async (req, res) => {
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
    console.error('Error in user search route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/game/saves', auth, checkSuspensionForGame, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() !== req.user._id.toString()) {
      console.error(`Security violation: User ${req.user._id} attempted to access saves for user ${user._id}`);
      return res.status(403).json({ success: false, message: 'Unauthorized access to user saves' });
    }
    
    const saves = user.gameSaves || [];
    
    const formattedSaves = saves.map(save => ({
      id: save.id,
      playerName: save.playerName || 'Unknown',
      timestamp: save.timestamp,
      data: save.data
    }));
    
    res.status(200).json({
      success: true,
      saves: formattedSaves
    });
  } catch (error) {
    console.error('Error in GET /game/saves route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/delete-account', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed reason (minimum 20 characters)'
      });
    }

    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    console.log(`Account deletion requested by user ${user.username} (${user._id})`);
    console.log(`Reason: ${reason}`);
    console.log(`IP: ${getRealIP(req)}`);
    console.log(`User Agent: ${req.get('User-Agent')}`);

    await deleteOtherSessions(req.user._id);
    
    await User.findByIdAndDelete(req.user._id);
    
    console.log(`Account ${user.username} (${user._id}) has been permanently deleted`);
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
        success: false, 
      message: 'Server error deleting account'
      });
    }
});

router.get('/2fa/status', auth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      twoFactorAuth: {
        enabled: user.twoFactorAuth.enabled,
        setupCompleted: user.twoFactorAuth.setupCompleted,
        method: user.twoFactorAuth.method,
        lastUsed: user.twoFactorAuth.lastUsed,
        backupCodesRemaining: user.twoFactorAuth.backupCodes.filter(code => !code.used).length
      }
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/2fa/setup', auth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.twoFactorAuth.enabled) {
      return res.status(400).json({ success: false, message: '2FA is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `Neighborville (${user.username})`,
      issuer: 'Neighborville',
      length: 32
    });

    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      backupCodes.push({ code, used: false });
    }

    user.twoFactorAuth.secret = secret.base32;
    user.twoFactorAuth.backupCodes = backupCodes;
    await user.save();

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      secret: secret.base32,
      qrCodeUrl,
      backupCodes: backupCodes.map(code => code.code)
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/2fa/verify-setup', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorAuth.secret) {
      return res.status(400).json({ success: false, message: 'No 2FA setup in progress' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    res.status(200).json({ success: true, message: 'Verification successful' });
  } catch (error) {
    console.error('Error verifying 2FA setup:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/2fa/complete-setup', auth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorAuth.secret) {
      return res.status(400).json({ success: false, message: 'No 2FA setup in progress' });
    }

    user.twoFactorAuth.enabled = true;
    user.twoFactorAuth.setupCompleted = true;
    await user.save();

    res.status(200).json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Error completing 2FA setup:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/2fa/disable', auth, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorAuth.enabled) {
      return res.status(400).json({ success: false, message: '2FA is not enabled' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    user.twoFactorAuth.enabled = false;
    user.twoFactorAuth.secret = null;
    user.twoFactorAuth.backupCodes = [];
    user.twoFactorAuth.setupCompleted = false;
    await user.save();

    res.status(200).json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/2fa/backup-codes', auth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorAuth.enabled) {
      return res.status(400).json({ success: false, message: '2FA is not enabled' });
    }

    res.status(200).json({
      success: true,
      backupCodes: user.twoFactorAuth.backupCodes
    });
  } catch (error) {
    console.error('Error getting backup codes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/2fa/regenerate-backup-codes', auth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorAuth.enabled) {
      return res.status(400).json({ success: false, message: '2FA is not enabled' });
    }

    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      backupCodes.push({ code, used: false });
    }

    user.twoFactorAuth.backupCodes = backupCodes;
    await user.save();

    res.status(200).json({
      success: true,
      backupCodes: backupCodes
    });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/2fa/verify', auth, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const user = await findUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorAuth.enabled) {
      return res.status(400).json({ success: false, message: '2FA is not enabled' });
    }

    let verified = false;

    if (token.length === 8) {
      const backupCode = user.twoFactorAuth.backupCodes.find(
        code => code.code === token.toUpperCase() && !code.used
      );
      
      if (backupCode) {
        backupCode.used = true;
        backupCode.usedAt = new Date();
        user.twoFactorAuth.lastUsed = new Date();
        await user.save();
        verified = true;
      }
    } else if (token.length === 6) {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorAuth.secret,
        encoding: 'base32',
        token: token,
        window: 2
      });
      
      if (verified) {
        user.twoFactorAuth.lastUsed = new Date();
        await user.save();
      }
    }

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    res.status(200).json({ success: true, message: 'Verification successful' });
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/verify', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
], async (req, res) => {
  try {
    console.warn('DEPRECATED: /verify endpoint used. Please use /verify-login instead.');
    
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
          const moderation = ContentModerationService.moderateContent(username);
          if (!moderation.isValid) {
            await ContentModerationService.logModerationAction(
              email,
              username, 
              moderation.reason, 
              moderation.severity || 'unknown'
            );
            
            return res.status(400).json({ 
              success: false, 
              message: 'Username contains inappropriate content',
              reason: moderation.reason 
            });
          }
          
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
    } else {
      console.log(`Existing user found for ${email} with username: ${user.username}`);

      if (username && (!user.username || user.username.includes('@') || user.username === email.split('@')[0])) {
        const existingUsername = await findUserByUsername(username);
        if (existingUsername && existingUsername._id.toString() !== user._id.toString()) {
          return res.status(409).json({ 
            success: false, 
            message: 'Username already taken' 
          });
        }
        
        user.username = username;
        await user.save();
        console.log(`Updated username for existing user ${email} to ${username}`);
      }
      
      isNewRegistration = false;
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
    
    if (user.twoFactorAuth.enabled && !req.body.twoFactorToken) {
      return res.status(200).json({
        success: true,
        message: 'Email verified. 2FA required.',
        requires2FA: true,
        userId: user._id.toString()
      });
    }
    
    if (user.twoFactorAuth.enabled && req.body.twoFactorToken) {
      const isValidToken = user.verifyTwoFactorToken(req.body.twoFactorToken);
      if (!isValidToken) {
        return res.status(400).json({
          success: false,
          message: 'Invalid 2FA token',
          requires2FA: true
        });
      }
    }
    
    const userAgent = req.headers['user-agent'];
    const ip = getRealIP(req);
    
    if (user.trackIP) {
      await user.trackIP(ip, userAgent);
    }

    if (user.updateActivityStats) {
      await user.updateActivityStats();
    }

    const session = await createSession(user, userAgent, ip);
    const token = setAuthCookie(res, user._id);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: user.toProfile(),
      token: token,
      isNewRegistration
    });
  } catch (error) {
    console.error('Error in /verify route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const sort = req.query.sort || 'level';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let sortQuery = {};
    switch (sort) {
      case 'level':
        sortQuery = { 'gameData.level': -1, 'gameData.experience': -1 };
        break;
      case 'buildingCount':
        sortQuery = { 'gameData.totalBuildings': -1 };
        break;
      case 'day':
        sortQuery = { 'gameData.day': -1 };
        break;
      default:
        sortQuery = { 'gameData.level': -1 };
    }

    const users = await User.find({
      'gameData': { $exists: true, $ne: null },
      'role': { $ne: 'admin' }
    })
    .select('username gameData createdAt lastSave')
    .sort(sortQuery)
    .skip(skip)
    .limit(limit);

    const total = await User.countDocuments({
      'gameData': { $exists: true, $ne: null },
      'role': { $ne: 'admin' }
    });

    const leaderboard = users.map((user, index) => ({
      username: user.username,
      playerName: user.gameData?.playerName || user.gameData?.neighborhoodName || user.username,
      level: user.gameData?.level || 1,
      day: user.gameData?.day || 1,
      buildingCount: user.gameData?.grid?.filter(cell => cell !== null).length || 0,
      lastActive: (user.lastSave || user.createdAt).toISOString(),
      happiness: user.gameData?.happiness || 0
    }));

    res.status(200).json({
      success: true,
      leaderboard: leaderboard,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /leaderboard route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch leaderboard' 
    });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        profileSettings: user.profileSettings || {
          visibility: 'public',
          showBio: true,
          showStats: true,
          showActivity: true,
          showSocialLinks: false,
          showAchievements: true
        },
        extendedProfile: user.extendedProfile || {
          bio: '',
          location: '',
          website: '',
          interests: []
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /profile route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { profileSettings, extendedProfile } = req.body;
    
    const user = await findUserById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (profileSettings) {
      user.profileSettings = { ...user.profileSettings, ...profileSettings };
    }
    
    if (extendedProfile) {
      user.extendedProfile = { ...user.extendedProfile, ...extendedProfile };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        profileSettings: user.profileSettings,
        extendedProfile: user.extendedProfile
      }
    });
  } catch (error) {
    console.error('Error in PUT /profile route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

router.get('/sessions', auth, async (req, res) => {
  try {
    const sessionsData = await getUserSessions(req.user._id);
    
    if (sessionsData.success) {
      res.status(200).json(sessionsData);
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch sessions' 
      });
    }
  } catch (error) {
    console.error('Error in GET /sessions route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sessions' 
    });
  }
});

router.delete('/sessions/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const success = await deleteSessionById(sessionId, req.user._id);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Session revoked successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Session not found or could not be revoked'
      });
    }
  } catch (error) {
    console.error('Error in DELETE /sessions/:sessionId route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to revoke session' 
    });
  }
});

router.delete('/sessions/revoke-all', auth, async (req, res) => {
  try {
    const success = await deleteOtherSessions(req.user._id, req.headers.authorization?.split(' ')[1]);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'All other sessions revoked successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to revoke sessions'
      });
    }
  } catch (error) {
    console.error('Error in DELETE /sessions/revoke-all route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to revoke sessions' 
    });
  }
});

export default router; 