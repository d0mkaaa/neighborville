import express from 'express';
import { auth } from '../middleware/auth.js';
import { findUserById } from '../services/userService.js';

const router = express.Router();

router.post('/user/game/active-save/:id', auth, async (req, res) => {
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

export default router; 