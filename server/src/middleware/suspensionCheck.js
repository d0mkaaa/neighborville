import IPSuspension from '../models/IPSuspension.js';
import { getRealIP } from '../utils/ipUtils.js';

export const checkSuspension = async (req, res, next) => {
  try {
    const exemptRoutes = [
      '/api/auth/logout',
      '/api/user/suspension-status',
      '/api/auth/verify'
    ];
    
    if (exemptRoutes.includes(req.path)) {
      return next();
    }

    const userIP = getRealIP(req);
    if (userIP) {
      const ipSuspensions = await IPSuspension.findActiveForIP(userIP);
      if (ipSuspensions.length > 0) {
        const suspension = ipSuspensions[0];
        console.log(`IP ${userIP} is suspended:`, suspension.reason);
        
        return res.status(403).json({
          success: false,
          suspended: true,
          suspensionType: 'ip',
          message: 'Your IP address has been suspended',
          suspension: {
            reason: suspension.reason,
            endDate: suspension.endDate,
            issuedBy: suspension.issuedBy?.username || 'System',
            startDate: suspension.startDate,
            type: 'ip',
            timeRemaining: Math.max(0, new Date(suspension.endDate) - new Date()),
            isPermanent: (new Date(suspension.endDate) - new Date()) > (365 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    if (req.user && req.user.checkSuspensionStatus()) {
      const activeSuspension = req.user.suspensions.find(s => s.isActive);
      
      return res.status(403).json({
        success: false,
        suspended: true,
        suspensionType: 'user',
        message: 'Your account has been suspended',
        suspension: {
          reason: activeSuspension.reason,
          endDate: activeSuspension.endDate,
          issuedBy: activeSuspension.issuedBy,
          startDate: activeSuspension.startDate,
          type: 'user'
        }
      });
    }

    next();
  } catch (error) {
    console.error('Error in suspension check middleware:', error);
    next();
  }
};

export const checkSuspensionForGame = async (req, res, next) => {
  try {
    const userIP = getRealIP(req);
    if (userIP) {
      const ipSuspensions = await IPSuspension.findActiveForIP(userIP);
      if (ipSuspensions.length > 0) {
        const suspension = ipSuspensions[0];
        console.log(`IP ${userIP} is suspended from game access:`, suspension.reason);
        
        return res.status(403).json({
          success: false,
          suspended: true,
          suspensionType: 'ip',
          message: 'Cannot access game features - IP address is suspended',
          suspension: {
            reason: suspension.reason,
            endDate: suspension.endDate,
            issuedBy: suspension.issuedBy?.username || 'System',
            startDate: suspension.startDate,
            type: 'ip',
            timeRemaining: Math.max(0, new Date(suspension.endDate) - new Date()),
            isPermanent: (new Date(suspension.endDate) - new Date()) > (365 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    if (req.user && req.user.checkSuspensionStatus()) {
      const activeSuspension = req.user.suspensions.find(s => s.isActive);
      
      return res.status(403).json({
        success: false,
        suspended: true,
        suspensionType: 'user',
        message: 'Cannot access game features while suspended',
        suspension: {
          reason: activeSuspension.reason,
          endDate: activeSuspension.endDate,
          issuedBy: activeSuspension.issuedBy,
          startDate: activeSuspension.startDate,
          type: 'user',
          timeRemaining: activeSuspension.endDate - new Date()
        }
      });
    }

    next();
  } catch (error) {
    console.error('Error in game suspension check middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking suspension status'
    });
  }
}; 