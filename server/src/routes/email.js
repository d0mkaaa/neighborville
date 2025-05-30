import express from 'express';
import { sendVerificationEmail, generateVerificationCode } from '../services/email.js';
import { storeVerificationCode, findUserByEmail, createUser, findUserByUsername, getStoredVerificationCode } from '../services/userService.js';

const router = express.Router();

router.post('/send-verification', async (req, res) => {
  try {
    const { email, username } = req.body;
  
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }
    
    const existingUser = await findUserByEmail(email);
    console.log(`Checking if user exists: ${email}, exists: ${!!existingUser}`);
    
    if (!existingUser && username) {
      try {
        const existingUsername = await findUserByUsername(username);
        if (existingUsername) {
          return res.status(409).json({ success: false, message: 'Username already taken' });
        }
        
        const tempPassword = Math.random().toString(36).slice(-8);
        await createUser(email, username, tempPassword);
        console.log(`Pre-created user for ${email} with username ${username}`);
      } catch (error) {
        console.error(`Error pre-creating user for ${email}:`, error);
      }
    }
    
    const existingCode = await getStoredVerificationCode(email);
    const verificationCode = existingCode || generateVerificationCode();
    
    if (!existingCode) {
      console.log(`Storing new verification code in Redis: ${email}`);
      const stored = await storeVerificationCode(email, verificationCode);
      
      if (!stored) {
        console.error(`Failed to store verification code for ${email}`);
        return res.status(500).json({ success: false, message: 'Failed to store verification code' });
      }
    } else {
      console.log(`Reusing existing verification code for ${email}`);
    }
    
    const result = await sendVerificationEmail(email, verificationCode, username);
    
    const response = {
      success: true,
      message: existingCode ? 'You already have a valid verification code' : 'Verification email sent with new code',
      fallback: result.fallback || false
    };
    
    if (process.env.NODE_ENV === 'development') {
      response.code = verificationCode;
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in /send-verification route:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification email' });
  }
});

export default router; 