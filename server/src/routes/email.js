import express from 'express';
import { sendVerificationEmail, generateVerificationCode } from '../services/email.js';
import { storeVerificationCode, findUserByEmail, createUser, findUserByUsername, getStoredVerificationCode } from '../services/userService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/send-verification', async (req, res) => {
  try {
    const { email, username } = req.body;
  
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const existingUser = await findUserByEmail(normalizedEmail);
    logger.debug(`✅ Checking if user exists: ${normalizedEmail}, exists: ${!!existingUser}`);

    if (!existingUser && username) {
      try {
        const existingUsername = await findUserByUsername(username);
        if (existingUsername) {
          return res.status(409).json({ success: false, message: 'Username already taken' });
        }
        
        const tempPassword = Math.random().toString(36).slice(-8);
        await createUser(normalizedEmail, username, tempPassword);
        logger.debug(`📝 Pre-created user for ${normalizedEmail} with username ${username}`);
      } catch (error) {
        logger.error(`Error pre-creating user for ${normalizedEmail}:`, error);
        if (error.code === 11000) {
          return res.status(409).json({ 
            success: false, 
            message: 'Email or username already exists' 
          });
        }
      }
    }
    
    const existingCode = await getStoredVerificationCode(normalizedEmail);
    let verificationCode;
    let isNewCode = false;
    
    if (existingCode) {
      verificationCode = existingCode;
      logger.debug(`♻️ REUSING existing verification code for ${normalizedEmail}`);
    } else {
      verificationCode = generateVerificationCode();
      isNewCode = true;
      logger.debug(`🆕 GENERATING new verification code for ${normalizedEmail}: ${verificationCode}`);
      
      const stored = await storeVerificationCode(normalizedEmail, verificationCode, 15);
      
      if (!stored) {
        logger.error(`Failed to store verification code for ${normalizedEmail}`);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to store verification code. Please try again.' 
        });
      }
    }
    
    try {
      const result = await sendVerificationEmail(normalizedEmail, verificationCode, username);
      logger.info(`📧 Email sending result for ${normalizedEmail}:`, result.messageId ? 'Success' : 'Failed');
      
      const response = {
        success: true,
        message: isNewCode 
          ? 'Verification code sent to your email!' 
          : 'Using your existing verification code. Check your email!',
        fallback: result.fallback || false,
        codeExpiry: '15 minutes'
      };
      
      if (process.env.NODE_ENV === 'development') {
        response.code = verificationCode;
        response.debugInfo = {
          email: normalizedEmail,
          isNewCode,
          hasExistingUser: !!existingUser
        };
      }
      
      res.status(200).json(response);
      
    } catch (emailError) {
      logger.error(`Email sending failed for ${normalizedEmail}:`, emailError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification email. Please try again.' 
      });
    }
    
  } catch (error) {
    logger.error('Error in /send-verification route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

export default router; 