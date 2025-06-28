import express from 'express';
import { auth } from '../middleware/cookieAuth.js';
import User from '../models/User.js';
import ModerationLog from '../models/ModerationLog.js';
import Report from '../models/Report.js';
import IPSuspension from '../models/IPSuspension.js';
import ModerationService from '../services/moderationService.js';
import { findUserByEmail, findUserById, getUserSessions, deleteOtherSessions } from '../services/userService.js';

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const requireModerator = (req, res, next) => {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Moderator access required' });
  }
  next();
};

const logAdminAction = async (adminId, action, details, targetUserId = null) => {
  try {
    console.log(`🔍 Logging admin action: ${action} by ${adminId} for user ${targetUserId}`);
    console.log(`🔍 Details: ${details}`);
    
    const moderationResult = {
      reason: `Admin action: ${action}`,
      severity: 'low',
      violationType: 'other',
      detectedItems: [action],
      cleanedText: details
    };
    
    const log = await ModerationService.logModerationAction(
      targetUserId || adminId,
      details,
      'other',
      moderationResult,
      adminId
    );
    
    console.log(`✅ Admin action logged successfully:`, log ? log._id : 'null');
    return log;
  } catch (error) {
    console.error('❌ Error logging admin action:', error);
  }
};

router.post('/make-admin', auth, async (req, res) => {
  try {
    const { userId, secretKey } = req.body;
    
    if (req.user.role === 'admin') {
      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID required' });
      }
      
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      targetUser.role = 'admin';
      targetUser.permissions = ['manage_users', 'moderate_content', 'view_admin_panel', 'manage_reports'];
      await targetUser.save();
      
      await logAdminAction(req.user._id, 'user_promoted', `Promoted ${targetUser.username} to admin`, targetUser._id);
      
      return res.status(200).json({
        success: true,
        message: `User ${targetUser.username} promoted to admin`,
        user: targetUser.toProfile()
      });
    }
    
    if (secretKey !== 'neighborville_admin_2024') {
      return res.status(403).json({ success: false, message: 'Invalid secret key' });
    }
    
    req.user.role = 'admin';
    req.user.permissions = ['manage_users', 'moderate_content', 'view_admin_panel', 'manage_reports'];
    await req.user.save();
    
    await logAdminAction(req.user._id, 'self_promoted', 'Used secret key to become admin', req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'You are now an admin',
      user: req.user.toProfile()
    });
  } catch (error) {
    console.error('Error in POST /admin/make-admin route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/users', auth, requireModerator, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';
    
    const skip = (page - 1) * limit;
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status === 'banned') {
      query.suspensions = { $elemMatch: { isActive: true } };
    } else if (status === 'active') {
      query.$nor = [{ suspensions: { $elemMatch: { isActive: true } } }];
    }
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password')
      .populate('suspensions.issuedBy', 'username')
      .populate('warnings.issuedBy', 'username');
    
    const total = await User.countDocuments(query);
    
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      verified: user.verified,
      createdAt: user.createdAt,
      isSuspended: user.isSuspended(),
      suspensions: user.suspensions,
      warnings: user.warnings,
      moderationStats: user.moderationStats,
      adminNotes: user.adminNotes,
      profileSettings: user.profileSettings,
      lastLogin: user.lastLogin,
      permissions: user.permissions
    }));
    
    res.status(200).json({
      success: true,
      users: formattedUsers,
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

router.get('/users/:userId/details', auth, requireModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('suspensions.issuedBy', 'username')
      .populate('warnings.issuedBy', 'username');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const reportsResult = await ModerationService.getReports(
      { $or: [{ reporterId: userId }, { reportedUserId: userId }] },
      1,
      50
    );
    
    const logsResult = await ModerationService.getModerationLogs(
      { userId: userId },
      1,
      50
    );
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt,
        isSuspended: user.isSuspended(),
        suspensions: user.suspensions,
        warnings: user.warnings,
        moderationStats: user.moderationStats,
        adminNotes: user.adminNotes,
        profileSettings: user.profileSettings,
        extendedProfile: user.extendedProfile,
        lastLogin: user.lastLogin,
        permissions: user.permissions,
        profileCompletion: user.calculateProfileCompletion()
      },
      reports: reportsResult.reports,
      moderationLogs: logsResult.logs
    });
  } catch (error) {
    console.error('Error in GET /admin/users/:userId/details route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/users/:userId/role', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, reason } = req.body;
    
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot demote yourself from admin' 
      });
    }
    
    const oldRole = user.role;
    user.role = role;
    if (role === 'admin') {
      user.permissions = ['manage_users', 'moderate_content', 'view_admin_panel', 'manage_reports'];
    } else if (role === 'moderator') {
      user.permissions = ['moderate_content', 'view_admin_panel', 'manage_reports'];
    } else {
      user.permissions = [];
    }
    
    await user.save();
    
    await logAdminAction(
      req.user._id, 
      'role_changed', 
      `Changed role from ${oldRole} to ${role}. Reason: ${reason || 'No reason provided'}`,
      user._id
    );
    
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

router.put('/users/:userId/suspend', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspend, reason, duration, severity } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot suspend yourself' 
      });
    }
    
    if (suspend) {
      let durationHours = 24;
      if (duration === 'permanent') {
        durationHours = 365 * 24;
      } else if (duration && !isNaN(parseInt(duration))) {
        durationHours = parseInt(duration);
      }
      
      const endDate = new Date(Date.now() + durationHours * 60 * 60 * 1000);
      
      await user.addSuspension(
        reason || 'Suspended by administrator',
        endDate,
        req.user._id
      );
      
      await logAdminAction(
        req.user._id,
        'user_suspended',
        `Suspended for ${durationHours}h. Reason: ${reason || 'No reason provided'}`,
        user._id
      );
    } else {
      user.suspensions.forEach(s => s.isActive = false);
      await user.save();
      
      await logAdminAction(
        req.user._id,
        'user_unsuspended',
        `Unsuspended by admin. Reason: ${reason || 'No reason provided'}`,
        user._id
      );
    }
    
    res.status(200).json({
      success: true,
      message: `User ${suspend ? 'suspended' : 'unsuspended'} successfully`,
      user: {
        id: user._id.toString(),
        username: user.username,
        isSuspended: user.isSuspended()
      }
    });
  } catch (error) {
    console.error('Error in PUT /admin/users/:userId/suspend route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/users/:userId/warn', auth, requireModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, severity } = req.body;
    
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Warning reason must be at least 10 characters' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.warnings.push({
      reason: reason.trim(),
      severity: severity || 'medium',
      issuedBy: req.user._id,
      issuedAt: new Date()
    });
    
    await user.save();
    
    await logAdminAction(
      req.user._id,
      'warning_issued',
      `Warning issued: ${reason}`,
      user._id
    );
    
    res.status(200).json({
      success: true,
      message: 'Warning issued successfully',
      warning: user.warnings[user.warnings.length - 1]
    });
  } catch (error) {
    console.error('Error in POST /admin/users/:userId/warn route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/users/:userId', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length < 20) {
      return res.status(400).json({ 
        success: false, 
        message: 'Deletion reason must be at least 20 characters' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete admin accounts' 
      });
    }
    
    const userDetails = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      suspensions: user.suspensions.length,
      warnings: user.warnings.length,
      profileCompletion: user.calculateProfileCompletion()
    };
    
    await logAdminAction(
      req.user._id,
      'user_deleted',
      `Account deleted. Reason: ${reason}. User details: ${JSON.stringify(userDetails)}`,
      user._id
    );
    
    await User.findByIdAndDelete(userId);
    
    await Report.updateMany(
      { $or: [{ reporterId: userId }, { reportedUserId: userId }] },
      { $set: { 'metadata.userDeleted': true, 'metadata.deletedAt': new Date() } }
    );
    
    res.status(200).json({
      success: true,
      message: `User ${user.username} deleted successfully`,
      deletedUser: userDetails
    });
  } catch (error) {
    console.error('Error in DELETE /admin/users/:userId route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/users/:userId/notes', auth, requireModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.adminNotes = notes || '';
    await user.save();
    
    await logAdminAction(
      req.user._id,
      'notes_updated',
      `Admin notes updated for user`,
      user._id
    );
    
    res.status(200).json({
      success: true,
      message: 'Admin notes updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /admin/users/:userId/notes route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/reports', auth, requireModerator, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status || '';
    const priority = req.query.priority || '';
    const severity = req.query.severity || '';
    const reportType = req.query.reportType || '';
    
    const result = await ModerationService.getReports(
      { 
        ...(status && { status }),
        ...(priority && { priority }),
        ...(severity && { severity }),
        ...(reportType && { reportType })
      },
      page,
      limit
    );
    
    res.status(200).json({
      success: true,
      reports: result.reports,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in GET /admin/reports route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/reports/:reportId/details', auth, requireModerator, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await Report.findById(reportId)
      .populate('reporterId', 'username email role')
      .populate('reportedUserId', 'username email role suspensions warnings')
      .populate('assignedModerator', 'username')
      .populate('resolution.resolvedBy', 'username')
      .populate('relatedReports');
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    
    const logsResult = await ModerationService.getModerationLogs(
      { 'metadata.reportId': reportId },
      1,
      50
    );
    
    res.status(200).json({
      success: true,
      report,
      moderationLogs: logsResult.logs
    });
  } catch (error) {
    console.error('Error in GET /admin/reports/:reportId/details route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/reports/:reportId/resolve', auth, requireModerator, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, action, reason, notes } = req.body;
    
    if (!['pending', 'under_review', 'resolved', 'dismissed', 'escalated'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const report = await Report.findById(reportId)
      .populate('reportedUserId', 'username');
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    
    report.status = status;
    if (status === 'resolved' || status === 'dismissed') {
      report.resolution = {
        action: action || (status === 'resolved' ? 'action_taken' : 'no_action'),
        reason: reason || `Report ${status} by moderator`,
        notes: notes || '',
        resolvedBy: req.user._id,
        resolvedAt: new Date()
      };
    }
    
    await report.save();
    
    await logAdminAction(
      req.user._id,
      'report_resolved',
      `Report ${status}. Action: ${action || 'none'}. Reason: ${reason || 'none'}`,
      report.reportedUserId._id
    );
    
    res.status(200).json({
      success: true,
      message: `Report ${status} successfully`,
      report
    });
  } catch (error) {
    console.error('Error in PUT /admin/reports/:reportId/resolve route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/reports/:reportId/assign', auth, requireModerator, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await ModerationService.assignReport(reportId, req.user._id);
    
    await logAdminAction(
      req.user._id,
      'report_assigned',
      `Report assigned to ${req.user.username}`,
      report.reportedUserId
    );
    
    res.status(200).json({
      success: true,
      message: 'Report assigned successfully',
      report
    });
  } catch (error) {
    console.error('Error in PUT /admin/reports/:reportId/assign route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/moderation-logs', auth, requireModerator, async (req, res) => {
  try {
    console.log('🔍 Moderation logs route called');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action || '';
    const userId = req.query.userId || '';
    const moderatorId = req.query.moderatorId || '';
    
    const filters = {
      ...(action && { action }),
      ...(userId && { userId }),
      ...(moderatorId && { moderatorId })
    };
    
    console.log('🔍 Filters:', filters);
    
    const totalLogs = await ModerationLog.countDocuments();
    console.log(`🔍 Total ModerationLog entries in database: ${totalLogs}`);
    
    const result = await ModerationService.getModerationLogs(filters, page, limit);
    
    console.log(`🔍 ModerationService returned ${result.logs.length} logs`);
    
    res.status(200).json({
      success: true,
      logs: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('❌ Error in GET /admin/moderation-logs route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/dashboard-stats', auth, requireModerator, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const suspendedUsers = await User.countDocuments({ 
      suspensions: { $elemMatch: { isActive: true } } 
    });
    
    const recentActivity = await ModerationLog.find()
      .populate('userId', 'username')
      .populate('moderatorId', 'username')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`Found ${recentActivity.length} recent activity entries`);
    
    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalReports,
        pendingReports,
        suspendedUsers,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error in GET /admin/dashboard-stats route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/appeals', auth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status || 'pending';
    
    const appeals = await User.aggregate([
      { $match: { 'appeals.status': status } },
      
      { $unwind: '$appeals' },
      
      { $match: { 'appeals.status': status } },
      
      { $sort: { 'appeals.submittedAt': -1 } },
      
      { $limit: limit },
      
      {
        $lookup: {
          from: 'users',
          let: { 
            userId: '$_id',
            suspensionId: '$appeals.suspensionId'
          },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
            { $unwind: '$suspensions' },
            { $match: { $expr: { $eq: ['$suspensions._id', '$$suspensionId'] } } },
            {
              $lookup: {
                from: 'users',
                localField: 'suspensions.issuedBy',
                foreignField: '_id',
                as: 'issuedByUser'
              }
            },
            {
              $project: {
                'suspensions.reason': 1,
                'suspensions.startDate': 1,
                'suspensions.endDate': 1,
                'suspensions.isActive': 1,
                'issuedBy': { $arrayElemAt: ['$issuedByUser.username', 0] }
              }
            }
          ],
          as: 'suspensionDetails'
        }
      },
      
      {
        $lookup: {
          from: 'users',
          localField: 'appeals.reviewedBy',
          foreignField: '_id',
          as: 'reviewedByUser'
        }
      },
      
      {
        $project: {
          id: '$appeals._id',
          userId: '$_id',
          username: 1,
          email: 1,
          suspensionId: '$appeals.suspensionId',
          reason: '$appeals.reason',
          status: '$appeals.status',
          submittedAt: '$appeals.submittedAt',
          reviewedAt: '$appeals.reviewedAt',
          reviewedBy: { $arrayElemAt: ['$reviewedByUser.username', 0] },
          adminResponse: '$appeals.adminResponse',
          suspension: {
            $cond: {
              if: { $gt: [{ $size: '$suspensionDetails' }, 0] },
              then: {
                reason: { $arrayElemAt: ['$suspensionDetails.suspensions.reason', 0] },
                startDate: { $arrayElemAt: ['$suspensionDetails.suspensions.startDate', 0] },
                endDate: { $arrayElemAt: ['$suspensionDetails.suspensions.endDate', 0] },
                issuedBy: { $arrayElemAt: ['$suspensionDetails.issuedBy', 0] },
                isActive: { $arrayElemAt: ['$suspensionDetails.suspensions.isActive', 0] }
              },
              else: null
            }
          }
        }
      }
    ]);
    
    const totalAppeals = await User.aggregate([
      { $match: { 'appeals.status': status } },
      { $unwind: '$appeals' },
      { $match: { 'appeals.status': status } },
      { $count: 'total' }
    ]);
    
    const total = totalAppeals[0]?.total || 0;
    
    res.status(200).json({
      success: true,
      appeals,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalAppeals: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching appeals:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appeals'
    });
  }
});

router.post('/appeals/:appealId/review', auth, requireAdmin, async (req, res) => {
  try {
    const { appealId } = req.params;
    const { action, response } = req.body;
    
    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "deny"'
      });
    }
    
    if (!response || response.length < 10 || response.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Admin response must be between 10 and 500 characters'
      });
    }
    
    const user = await User.findOne({ 'appeals._id': appealId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Appeal not found'
      });
    }
    
    const appeal = user.appeals.id(appealId);
    if (!appeal) {
      return res.status(404).json({
        success: false,
        message: 'Appeal not found'
      });
    }
    
    if (appeal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Appeal has already been reviewed'
      });
    }
    
    appeal.status = action === 'approve' ? 'approved' : 'denied';
    appeal.reviewedAt = new Date();
    appeal.reviewedBy = req.user._id;
    appeal.adminResponse = response;
    
    if (action === 'approve') {
      const suspension = user.suspensions.find(s => 
        s._id.toString() === appeal.suspensionId.toString()
      );
      
      if (suspension) {
        suspension.isActive = false;
      }
    }
    
    await user.save();
    
    console.log('🔍 About to log appeal review action...');
    
    try {
      const directLog = new ModerationLog({
        userId: user._id,
        moderatorId: req.user._id,
        contentType: 'other',
        originalContent: `Appeal ${action} for user ${user.username}`,
        cleanedContent: '',
        violationType: 'other',
        severity: 'low',
        action: 'warned',
        reason: `Admin ${action} appeal`,
        flaggedWords: [],
        flaggedPatterns: [],
        detectedItems: [action],
        isAutomated: false
      });
      
      await directLog.save();
      console.log(`✅ Direct ModerationLog created with ID: ${directLog._id}`);
    } catch (directError) {
      console.error('❌ Error creating direct ModerationLog:', directError);
    }
    
    await logAdminAction(
      req.user._id,
      'appeal_review',
      `${action === 'approve' ? 'Approved' : 'Denied'} appeal for user ${user.username}`,
      user._id
    );
    
    res.status(200).json({
      success: true,
      message: `Appeal ${action === 'approve' ? 'approved' : 'denied'} successfully`,
      appeal: {
        id: appeal._id,
        status: appeal.status,
        reviewedAt: appeal.reviewedAt,
        adminResponse: appeal.adminResponse,
        suspensionLifted: action === 'approve'
      }
    });
    
  } catch (error) {
    console.error('Error reviewing appeal:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reviewing appeal'
    });
  }
});

router.get('/appeals/stats', auth, requireAdmin, async (req, res) => {
  try {
    const totalAppeals = await User.aggregate([
      { $unwind: '$appeals' },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    const pendingAppeals = await User.aggregate([
      { $unwind: '$appeals' },
      { $match: { 'appeals.status': 'pending' } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    const approvedAppeals = await User.aggregate([
      { $unwind: '$appeals' },
      { $match: { 'appeals.status': 'approved' } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    const deniedAppeals = await User.aggregate([
      { $unwind: '$appeals' },
      { $match: { 'appeals.status': 'denied' } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        total: totalAppeals[0]?.count || 0,
        pending: pendingAppeals[0]?.count || 0,
        approved: approvedAppeals[0]?.count || 0,
        denied: deniedAppeals[0]?.count || 0,
        approvalRate: totalAppeals[0]?.count > 0 
          ? Math.round(((approvedAppeals[0]?.count || 0) / totalAppeals[0].count) * 100)
          : 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching appeal stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appeal statistics'
    });
  }
});

router.post('/test-log', auth, requireAdmin, async (req, res) => {
  try {
    console.log('🧪 Creating test moderation log entry...');
    
    const testLog = new ModerationLog({
      userId: req.user._id,
      moderatorId: req.user._id,
      contentType: 'other',
      originalContent: 'Test admin action',
      cleanedContent: '',
      violationType: 'other',
      severity: 'low',
      action: 'warned',
      reason: 'Test log entry',
      flaggedWords: [],
      flaggedPatterns: [],
      detectedItems: ['test'],
      isAutomated: false
    });
    
    await testLog.save();
    console.log(`✅ Test log created with ID: ${testLog._id}`);
    
    const allLogs = await ModerationLog.find().sort({ createdAt: -1 }).limit(5);
    console.log(`🔍 Found ${allLogs.length} total logs in database`);
    
    res.status(200).json({
      success: true,
      message: 'Test log created',
      testLogId: testLog._id,
      totalLogs: allLogs.length,
      recentLogs: allLogs
    });
  } catch (error) {
    console.error('❌ Error creating test log:', error);
    res.status(500).json({ success: false, message: 'Error creating test log' });
  }
});

router.get('/analytics/users', auth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const registrationTrends = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]);
    
    const activityStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $gte: ['$lastLogin', sevenDaysAgo] }, 1, 0]
            }
          },
          newUsers: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', sevenDaysAgo] }, 1, 0]
            }
          },
          suspendedUsers: {
            $sum: {
              $cond: [{ $gt: [{ $size: { $ifNull: ['$suspensions', []] } }, 0] }, 1, 0]
            }
          },
          averagePlayTime: { $avg: '$activityStats.totalPlayTime' },
          totalSessions: { $sum: '$activityStats.totalGameSessions' }
        }
      }
    ]);
    
    const riskDistribution = await User.aggregate([
      {
        $group: {
          _id: '$securityFlags.riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const geoDistribution = await User.aggregate([
      { $unwind: { path: '$ipHistory', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$ipHistory.location.country',
          count: { $sum: 1 }
        }
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      success: true,
      analytics: {
        registrationTrends,
        activity: activityStats[0] || {},
        riskDistribution,
        geoDistribution
      }
    });
    
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/security/overview', auth, requireAdmin, async (req, res) => {
  try {
    const highRiskUsers = await User.find({
      'securityFlags.riskLevel': { $in: ['high', 'critical'] }
    })
    .select('username email securityFlags ipHistory deviceFingerprints')
    .limit(20);
    
    const recentIPSuspensions = await IPSuspension.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .populate('issuedBy', 'username')
    .populate('targetUserId', 'username email')
    .sort({ createdAt: -1 })
    .limit(10);
    
    const suspiciousPatterns = await User.aggregate([
      {
        $match: {
          $or: [
            { 'securityFlags.suspiciousActivity': true },
            { 'securityFlags.hasMultipleAccounts': true },
            { 'securityFlags.isVpnUser': true }
          ]
        }
      },
      {
        $group: {
          _id: null,
          vpnUsers: {
            $sum: { $cond: ['$securityFlags.isVpnUser', 1, 0] }
          },
          multiAccountUsers: {
            $sum: { $cond: ['$securityFlags.hasMultipleAccounts', 1, 0] }
          },
          suspiciousUsers: {
            $sum: { $cond: ['$securityFlags.suspiciousActivity', 1, 0] }
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      security: {
        highRiskUsers: highRiskUsers.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          riskLevel: user.securityFlags.riskLevel,
          riskScore: user.assessRisk(),
          ipCount: user.ipHistory.length,
          deviceCount: user.deviceFingerprints.length,
          flags: {
            vpn: user.securityFlags.isVpnUser,
            multiAccount: user.securityFlags.hasMultipleAccounts,
            suspicious: user.securityFlags.suspiciousActivity
          }
        })),
        recentIPSuspensions,
        patterns: suspiciousPatterns[0] || {}
      }
    });
    
  } catch (error) {
    console.error('Error fetching security overview:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/ip-suspensions', auth, requireAdmin, async (req, res) => {
  try {
    const { ip, reason, duration, severity, targetUserId, notes } = req.body;
    
    if (!ip || !reason) {
      return res.status(400).json({
        success: false,
        message: 'IP address and reason are required'
      });
    }
    
    const durationHours = parseInt(duration) || 24;
    const endDate = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    const ipSuspension = new IPSuspension({
      ip,
      reason,
      endDate,
      issuedBy: req.user._id,
      targetUserId: targetUserId || null,
      severity: severity || 'temporary',
      notes: notes || '',
      type: 'ip'
    });
    
    await ipSuspension.save();
    
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        await targetUser.addIPSuspension(ip, reason, endDate, req.user._id, 'ip', severity);
      }
    }
    
    const usersWithIP = await User.find({
      'ipHistory.ip': ip
    });
    
    for (const user of usersWithIP) {
      await ipSuspension.addAffectedUser(user._id, '', '');
    }
    
    await logAdminAction(
      req.user._id,
      'ip_suspension',
      `IP suspended: ${ip}. Reason: ${reason}. Duration: ${durationHours}h`,
      targetUserId
    );
    
    res.status(201).json({
      success: true,
      message: 'IP suspension created successfully',
      suspension: ipSuspension,
      affectedUsers: usersWithIP.length
    });
    
  } catch (error) {
    console.error('Error creating IP suspension:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/ip-suspensions', auth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = req.query.status || 'all';
    const skip = (page - 1) * limit;
    
    let query = {};
    if (status === 'active') {
      query = { isActive: true, endDate: { $gt: new Date() } };
    } else if (status === 'expired') {
      query = { $or: [{ isActive: false }, { endDate: { $lte: new Date() } }] };
    }
    
    const suspensions = await IPSuspension.find(query)
      .populate('issuedBy', 'username')
      .populate('targetUserId', 'username email')
      .populate('affectedUsers.userId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await IPSuspension.countDocuments(query);
    
    res.status(200).json({
      success: true,
      suspensions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching IP suspensions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/ip-suspensions/:suspensionId', auth, requireAdmin, async (req, res) => {
  try {
    const { suspensionId } = req.params;
    const { reason } = req.body;
    
    const suspension = await IPSuspension.findById(suspensionId);
    if (!suspension) {
      return res.status(404).json({
        success: false,
        message: 'IP suspension not found'
      });
    }
    
    suspension.isActive = false;
    suspension.notes += `\n[${new Date().toISOString()}] Lifted by ${req.user.username}: ${reason || 'No reason provided'}`;
    await suspension.save();
    
    await logAdminAction(
      req.user._id,
      'ip_suspension_lifted',
      `IP suspension lifted for ${suspension.ip}. Reason: ${reason || 'No reason provided'}`,
      suspension.targetUserId
    );
    
    res.status(200).json({
      success: true,
      message: 'IP suspension lifted successfully'
    });
    
  } catch (error) {
    console.error('Error lifting IP suspension:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/users/advanced-search', auth, requireAdmin, async (req, res) => {
  try {
    const {
      query: searchQuery,
      riskLevel,
      hasVPN,
      hasMultipleAccounts,
      ipAddress,
      minSuspensions,
      accountAge,
      lastActive
    } = req.query;
    
    let mongoQuery = {};
    
    if (searchQuery) {
      mongoQuery.$or = [
        { username: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    if (riskLevel && riskLevel !== 'all') {
      mongoQuery['securityFlags.riskLevel'] = riskLevel;
    }
    
    if (hasVPN === 'true') {
      mongoQuery['securityFlags.isVpnUser'] = true;
    }
    
    if (hasMultipleAccounts === 'true') {
      mongoQuery['securityFlags.hasMultipleAccounts'] = true;
    }
    
    if (ipAddress) {
      mongoQuery['ipHistory.ip'] = ipAddress;
    }
    
    if (minSuspensions) {
      mongoQuery.$expr = {
        $gte: [{ $size: { $ifNull: ['$suspensions', []] } }, parseInt(minSuspensions)]
      };
    }
    
    if (accountAge) {
      const daysAgo = new Date(Date.now() - parseInt(accountAge) * 24 * 60 * 60 * 1000);
      mongoQuery.createdAt = { $gte: daysAgo };
    }
    
    if (lastActive) {
      const daysAgo = new Date(Date.now() - parseInt(lastActive) * 24 * 60 * 60 * 1000);
      mongoQuery.lastLogin = { $gte: daysAgo };
    }
    
    const users = await User.find(mongoQuery)
      .select('-password')
      .populate('suspensions.issuedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(50);
    
    const results = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      riskLevel: user.securityFlags.riskLevel,
      riskScore: user.assessRisk(),
      securityFlags: user.securityFlags,
      suspensionCount: user.suspensions.length,
      warningCount: user.warnings.length,
      ipCount: user.ipHistory.length,
      deviceCount: user.deviceFingerprints.length,
      activityStats: user.activityStats
    }));
    
    res.status(200).json({
      success: true,
      users: results,
      count: results.length
    });
    
  } catch (error) {
    console.error('Error in advanced user search:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/users/bulk-action', auth, requireAdmin, async (req, res) => {
  try {
    const { userIds, action, reason, duration } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }
    
    if (userIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Cannot perform bulk action on more than 50 users at once'
      });
    }
    
    const results = [];
    
    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          results.push({ userId, success: false, error: 'User not found' });
          continue;
        }
        
        switch (action) {
          case 'suspend':
            const endDate = new Date(Date.now() + (parseInt(duration) || 24) * 60 * 60 * 1000);
            await user.addSuspension(reason || 'Bulk suspension', endDate, req.user._id);
            break;
            
          case 'warn':
            await user.addWarning(reason || 'Bulk warning', req.user._id, 'medium');
            break;
            
          case 'verify':
            user.verified = true;
            await user.save();
            break;
            
          case 'unverify':
            user.verified = false;
            await user.save();
            break;
            
          case 'flag-risk':
            user.securityFlags.suspiciousActivity = true;
            user.securityFlags.riskLevel = 'high';
            await user.save();
            break;
            
          default:
            results.push({ userId, success: false, error: 'Invalid action' });
            continue;
        }
        
        results.push({ userId, success: true });
        
        await logAdminAction(
          req.user._id,
          `bulk_${action}`,
          `Bulk ${action}: ${reason || 'No reason provided'}`,
          userId
        );
        
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Bulk action completed`,
      results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
    
  } catch (error) {
    console.error('Error in bulk user action:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/users/:userId/sessions', auth, requireModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const sessions = await getUserSessions(userId);
    
    const enhancedSessions = sessions.map(session => ({
      id: session._id,
      ipAddress: session.clientInfo?.ip || 'Unknown',
      userAgent: session.clientInfo?.userAgent || 'Unknown',
      device: {
        type: session.clientInfo?.device || 'unknown',
        browser: session.clientInfo?.browser || 'Unknown',
        os: session.clientInfo?.os || 'Unknown'
      },
      location: session.clientInfo?.location || null,
      loginTime: session.createdAt,
      lastActivity: session.lastActive,
      isActive: session.isValid(),
      isCurrent: false,
      duration: Math.floor((Date.now() - new Date(session.createdAt).getTime()) / (1000 * 60)),
      riskScore: session.riskScore || 0,
      flags: {
        vpnDetected: session.flags?.vpnDetected || false,
        suspiciousLocation: session.flags?.suspiciousLocation || false,
        deviceMismatch: session.flags?.deviceMismatch || false
      }
    }));
    
    await logAdminAction(
      req.user._id,
      'viewed_user_sessions',
      `Viewed sessions for user ${user.username}`,
      userId
    );
    
    res.status(200).json({
      success: true,
      sessions: enhancedSessions,
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error in GET /admin/users/:userId/sessions route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/users/:userId/ip-suspend', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration, includeConnectedAccounts } = req.body;
    
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'IP suspension reason must be at least 10 characters' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const sessions = await getUserSessions(userId);
    const ipAddresses = [...new Set(sessions.map(s => s.clientInfo?.ip).filter(Boolean))];
    
    if (ipAddresses.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No IP addresses found for this user' 
      });
    }
    
    let durationHours = 24;
    if (duration === 'permanent') {
      durationHours = 365 * 24;
    } else if (duration && !isNaN(parseInt(duration.replace('h', '')))) {
      durationHours = parseInt(duration.replace('h', ''));
    }
    
    const endDate = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    const suspensions = [];
    for (const ip of ipAddresses) {
      const ipSuspension = new IPSuspension({
        ip: ip,
        reason: reason.trim(),
        startDate: new Date(),
        endDate: endDate,
        issuedBy: req.user._id,
        targetUserId: userId,
        type: 'ip',
        severity: durationHours >= 24 * 7 ? 'permanent' : 'temporary',
        isActive: true,
        affectedUsers: [{ userId: userId, detectedAt: new Date() }],
        notes: `IP suspension created via admin panel. Include connected accounts: ${includeConnectedAccounts}`
      });
      
      await ipSuspension.save();
      suspensions.push(ipSuspension);
    }
    
    await logAdminAction(
      req.user._id,
      'ip_suspension_created',
      `Created IP suspension for ${ipAddresses.length} IP(s). Duration: ${durationHours}h. Reason: ${reason}`,
      userId
    );
    
    res.status(200).json({
      success: true,
      message: `IP suspension created for ${ipAddresses.length} IP address(es)`,
      suspensions: suspensions.map(s => s._id)
    });
  } catch (error) {
    console.error('Error in POST /admin/users/:userId/ip-suspend route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/users/:userId/message', auth, requireModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim().length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message must be at least 5 characters' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!user.systemMessages) {
      user.systemMessages = [];
    }
    
    user.systemMessages.push({
      message: message.trim(),
      sentBy: req.user._id,
      sentAt: new Date(),
      read: false
    });
    
    await user.save();
    
    await logAdminAction(
      req.user._id,
      'system_message_sent',
      `Sent system message: ${message.substring(0, 100)}...`,
      userId
    );
    
    res.status(200).json({
      success: true,
      message: 'System message sent successfully'
    });
  } catch (error) {
    console.error('Error in POST /admin/users/:userId/message route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



router.post('/users/:userId/force-logout', auth, requireModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    await deleteOtherSessions(userId);
    
    await logAdminAction(
      req.user._id,
      'force_logout',
      `Forced logout for user ${user.username}`,
      userId
    );
    
    res.status(200).json({
      success: true,
      message: `User ${user.username} has been logged out from all devices`
    });
  } catch (error) {
    console.error('Error in POST /admin/users/:userId/force-logout route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/users/:userId/login-history', auth, requireModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const Session = (await import('../models/Session.js')).default;
    const sessions = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Session.countDocuments({ userId });
    
    const loginHistory = sessions.map(session => ({
      id: session._id,
      loginTime: session.createdAt,
      logoutTime: session.expiresAt,
      ipAddress: session.clientInfo?.ip || 'Unknown',
      userAgent: session.clientInfo?.userAgent || 'Unknown',
      device: {
        type: session.clientInfo?.device || 'unknown',
        browser: session.clientInfo?.browser || 'Unknown',
        os: session.clientInfo?.os || 'Unknown'
      },
      location: session.clientInfo?.location || null,
      duration: session.lastActive ? 
        Math.floor((new Date(session.lastActive) - new Date(session.createdAt)) / (1000 * 60)) : 0,
      wasForceLogout: session.forceLogout || false,
      riskFlags: session.flags || {}
    }));
    
    await logAdminAction(
      req.user._id,
      'viewed_login_history',
      `Viewed login history for user ${user.username}`,
      userId
    );
    
    res.status(200).json({
      success: true,
      loginHistory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error in GET /admin/users/:userId/login-history route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/users/:userId/impersonate', auth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot impersonate yourself' 
      });
    }
    
    const impersonationToken = Math.random().toString(36).substring(2, 15);
    
    console.log(`Admin ${req.user.username} impersonating ${user.username}`);
    
    await logAdminAction(
      req.user._id,
      'user_impersonation',
      `Started impersonating user ${user.username}`,
      userId
    );
    
    res.status(200).json({
      success: true,
      message: `Now impersonating ${user.username}`,
      impersonationToken,
      targetUser: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error in POST /admin/users/:userId/impersonate route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/users/:userId/suspend', auth, requireModerator, async (req, res) => {
  try {
    const { userId } = req.params;
    const { suspend, reason, duration, alsoSuspendIP } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (suspend) {
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ 
          success: false, 
          message: 'Suspension reason must be at least 10 characters' 
        });
      }
      
      const durationHours = duration || 24;
      const endDate = new Date();
      endDate.setHours(endDate.getHours() + durationHours);
      
      const suspension = {
        reason: reason.trim(),
        startDate: new Date(),
        endDate: endDate,
        issuedBy: req.user._id,
        isActive: true
      };
      
      if (!user.suspensions) {
        user.suspensions = [];
      }
      
      user.suspensions.forEach(s => s.isActive = false);
      
      user.suspensions.push(suspension);
      
      await user.save();
      
      if (alsoSuspendIP) {
        try {
          const Session = (await import('../models/Session.js')).default;
          const recentSessions = await Session.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10);
          
          const ipAddresses = [...new Set(recentSessions
            .map(s => s.clientInfo?.ip)
            .filter(ip => ip))];
          
          if (ipAddresses.length > 0) {
            const suspensions = [];
            
            for (const ip of ipAddresses) {
              const ipSuspension = new IPSuspension({
                ip: ip,
                reason: `IP suspension (account: ${user.username}) - ${reason}`,
                startDate: new Date(),
                endDate: endDate,
                issuedBy: req.user._id,
                targetUserId: userId,
                type: 'user',
                severity: 'temporary',
                isActive: true,
                affectedUsers: [{
                  userId: userId,
                  detectedAt: new Date()
                }],
                notes: `Suspended along with user account: ${user.username}`
              });
              
              await ipSuspension.save();
              suspensions.push(ipSuspension);
            }
            
            await logAdminAction(
              req.user._id,
              'user_and_ip_suspension_created',
              `Suspended user ${user.username} and ${ipAddresses.length} IP(s). Duration: ${durationHours}h. Reason: ${reason}`,
              userId
            );
          }
        } catch (ipError) {
          console.error('Error creating IP suspension:', ipError);
        }
      }
      
      if (!alsoSuspendIP) {
        await logAdminAction(
          req.user._id,
          'user_suspension_created',
          `Suspended user ${user.username}. Duration: ${durationHours}h. Reason: ${reason}`,
          userId
        );
      }
      
      res.status(200).json({
        success: true,
        message: `User ${user.username} has been suspended${alsoSuspendIP ? ' (including IP)' : ''}`,
        suspension: suspension
      });
    } else {
      if (user.suspensions) {
        user.suspensions.forEach(s => s.isActive = false);
        await user.save();
      }
      
      await logAdminAction(
        req.user._id,
        'user_suspension_removed',
        `Removed suspension for user ${user.username}`,
        userId
      );
      
      res.status(200).json({
        success: true,
        message: `User ${user.username} suspension has been removed`
      });
    }
  } catch (error) {
    console.error('Error in PUT /admin/users/:userId/suspend route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router; 