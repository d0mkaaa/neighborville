import express from 'express';
import { auth } from '../middleware/cookieAuth.js';
import ModerationService from '../services/moderationService.js';
import { findUserById, findUserByUsername } from '../services/userService.js';

const router = express.Router();

router.post('/check-existing', auth, async (req, res) => {
  try {
    const { reportedUsername } = req.body;

    if (!reportedUsername) {
      return res.status(400).json({
        success: false,
        message: 'reportedUsername is required'
      });
    }

    const reportedUser = await findUserByUsername(reportedUsername);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const existingReports = await ModerationService.getReports(
      {
        reporterId: req.user._id,
        reportedUserId: reportedUser._id,
        createdAt: { $gte: twentyFourHoursAgo }
      },
      1,
      10
    );

    const canReport = existingReports.reports.length < 3;

    res.status(200).json({
      success: true,
      canReport,
      reports: existingReports.reports.map(report => ({
        id: report._id,
        reportType: report.reportType,
        category: report.category,
        status: report.status,
        createdAt: report.createdAt
      })),
      message: canReport 
        ? 'You can submit a report for this user'
        : 'You have reached the maximum number of reports for this user in 24 hours'
    });

  } catch (error) {
    console.error('Error checking existing reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check existing reports'
    });
  }
});

router.post('/submit', auth, async (req, res) => {
  try {
    const {
      reportedUsername,
      reportType,
      category,
      description,
      evidence,
      specificContent,
      isAnonymous = false
    } = req.body;

    if (!reportedUsername || !reportType || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reportedUsername, reportType, category, description'
      });
    }

    if (description.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 20 characters long'
      });
    }

    if (description.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description must be less than 1000 characters'
      });
    }

    const validReportTypes = [
      'inappropriate_profile', 'harassment', 'spam', 'hate_speech', 
      'impersonation', 'inappropriate_content', 'privacy_violation', 'cheating_exploitation'
    ];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
    }

    const categoryMap = {
      inappropriate_profile: [
        'hate_speech', 'harassment', 'sexual_content', 'spam', 'personal_info', 
        'offensive_language', 'inappropriate_images', 'misleading_info', 'other'
      ],
      harassment: [
        'targeted_harassment', 'bullying', 'threats', 'doxxing', 'stalking',
        'unwanted_contact', 'intimidation', 'cyberbullying', 'other'
      ],
      spam: [
        'spam_content', 'fake_account', 'promotional_abuse', 'bot_activity',
        'duplicate_account', 'scam_attempt', 'phishing', 'malicious_links', 'other'
      ],
      hate_speech: [
        'racial_discrimination', 'religious_hatred', 'gender_discrimination', 
        'sexual_orientation_discrimination', 'disability_discrimination', 
        'age_discrimination', 'nationality_discrimination', 'other_discrimination', 'other'
      ],
      impersonation: [
        'celebrity_impersonation', 'user_impersonation', 'brand_impersonation',
        'government_impersonation', 'organization_impersonation', 'identity_theft', 'other'
      ],
      inappropriate_content: [
        'sexual_content', 'violent_content', 'disturbing_content', 'illegal_content',
        'graphic_content', 'self_harm', 'drug_content', 'weapon_content', 'other'
      ],
      privacy_violation: [
        'personal_info_sharing', 'private_photos', 'contact_info', 'location_sharing',
        'financial_info', 'medical_info', 'family_info', 'other'
      ],
      cheating_exploitation: [
        'game_cheating', 'exploit_abuse', 'unfair_advantage', 'account_sharing',
        'real_money_trading', 'griefing', 'game_disruption', 'other'
      ]
    };

    if (!categoryMap[reportType] || !categoryMap[reportType].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category for the selected report type'
      });
    }

    const reportedUser = await findUserByUsername(reportedUsername);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reported user not found'
      });
    }

    if (reportedUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingReports = await ModerationService.getReports(
      {
        reporterId: req.user._id,
        reportedUserId: reportedUser._id,
        createdAt: { $gte: twentyFourHoursAgo }
      },
      1,
      10
    );

    if (existingReports.reports.length >= 3) {
      return res.status(429).json({
        success: false,
        message: 'You have reached the maximum number of reports for this user in 24 hours'
      });
    }

    const duplicateReport = existingReports.reports.find(report => 
      report.reportType === reportType && 
      report.category === category
    );

    if (duplicateReport) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a similar report for this user recently'
      });
    }

    const moderationResult = await ModerationService.moderateContent(
      req.user._id,
      description,
      'report_description'
    );

    if (!moderationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Report description contains inappropriate content',
        details: moderationResult.reason
      });
    }

    const reportData = {
      reporterId: req.user._id,
      reportedUserId: reportedUser._id,
      reportType,
      category,
      description: description.trim(),
      evidence: evidence ? evidence.trim() : undefined,
      specificContent: specificContent || undefined,
      isAnonymous,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date()
      }
    };

    const report = await ModerationService.createReport(reportData);

    await ModerationService.logModerationAction(
      req.user._id,
      null,
      'report_created',
      `User reported ${reportedUsername} for ${reportType}`,
      'info',
      false,
      {
        reportId: report._id,
        reportType,
        category,
        reportedUserId: reportedUser._id
      }
    );

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      reportId: report._id,
      status: report.status,
      priority: report.priority,
      severity: report.severity,
      estimatedReviewTime: report.estimatedReviewTime
    });

  } catch (error) {
    if (error.message.includes('already reported')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report'
    });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const {
      reportedUsername,
      reportType,
      category,
      description,
      evidence,
      isAnonymous = false
    } = req.body;

    if (!reportedUsername || !reportType || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reportedUsername, reportType, category, description'
      });
    }

    const validReportTypes = [
      'inappropriate_profile', 'harassment', 'spam', 'hate_speech', 
      'impersonation', 'inappropriate_content', 'cheating', 'other'
    ];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
    }

    const validCategories = ['profile', 'behavior', 'content', 'technical'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const reportedUser = await findUserByUsername(reportedUsername);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: 'Reported user not found'
      });
    }

    if (reportedUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }

    const reportData = {
      reporterId: req.user._id,
      reportedUserId: reportedUser._id,
      reportType,
      category,
      description: description.trim(),
      evidence: evidence || {},
      isAnonymous,
      severity: calculateSeverity(reportType, description),
      tags: generateTags(reportType, category, description)
    };

    const report = await ModerationService.createReport(reportData);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      reportId: report._id,
      status: report.status,
      priority: report.priority
    });

  } catch (error) {
    if (error.message.includes('already reported')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report'
    });
  }
});

router.get('/my-reports', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    
    const result = await ModerationService.getReports(
      { reporterId: req.user._id },
      page,
      limit
    );

    const userReports = result.reports.map(report => ({
      id: report._id,
      reportedUser: report.reportedUserId.username,
      reportType: report.reportType,
      category: report.category,
      description: report.description,
      status: report.status,
      priority: report.priority,
      createdAt: report.createdAt,
      resolution: report.resolution ? {
        action: report.resolution.action,
        reason: report.resolution.reason,
        resolvedAt: report.resolution.resolvedAt
      } : null
    }));

    res.status(200).json({
      success: true,
      reports: userReports,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Error getting user reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports'
    });
  }
});

router.get('/:reportId/status', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const result = await ModerationService.getReports(
      { _id: reportId, reporterId: req.user._id },
      1,
      1
    );

    if (result.reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    const report = result.reports[0];
    
    res.status(200).json({
      success: true,
      report: {
        id: report._id,
        status: report.status,
        priority: report.priority,
        createdAt: report.createdAt,
        resolution: report.resolution ? {
          action: report.resolution.action,
          reason: report.resolution.reason,
          resolvedAt: report.resolution.resolvedAt
        } : null
      }
    });

  } catch (error) {
    console.error('Error getting report status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report status'
    });
  }
});

function calculateSeverity(reportType, category, description) {
  const highPriorityTypes = ['hate_speech', 'harassment', 'inappropriate_content'];
  const highPriorityCategories = ['threats', 'doxxing', 'illegal_content', 'violent_content'];
  const urgentKeywords = ['threat', 'suicide', 'harm', 'violence', 'illegal', 'kill', 'death'];
  
  const lowerDescription = description.toLowerCase();
  const hasUrgentKeywords = urgentKeywords.some(keyword => lowerDescription.includes(keyword));
  
  if (hasUrgentKeywords) {
    return 'critical';
  }
  
  if (highPriorityTypes.includes(reportType) || highPriorityCategories.includes(category)) {
    return 'high';
  }
  
  if (reportType === 'spam' || category === 'spam_content') {
    return 'low';
  }
  
  return 'medium';
}

function calculatePriority(reportType, category, description) {
  const severity = calculateSeverity(reportType, category, description);
  
  switch (severity) {
    case 'critical': return 'urgent';
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    default: return 'medium';
  }
}

function generateTags(reportType, category, description) {
  const tags = [reportType, category];
  
  const lowerDescription = description.toLowerCase();
  
  if (lowerDescription.includes('threat') || lowerDescription.includes('violence')) {
    tags.push('threats');
  }
  if (lowerDescription.includes('spam') || lowerDescription.includes('promotional')) {
    tags.push('spam');
  }
  if (lowerDescription.includes('fake') || lowerDescription.includes('impersonat')) {
    tags.push('impersonation');
  }
  if (lowerDescription.includes('hate') || lowerDescription.includes('discriminat')) {
    tags.push('hate_speech');
  }
  if (lowerDescription.includes('sexual') || lowerDescription.includes('inappropriate')) {
    tags.push('inappropriate_content');
  }
  
  return [...new Set(tags)];
}

function getEstimatedReviewTime(priority) {
  switch (priority) {
    case 'urgent': return '1-2 hours';
    case 'high': return '4-8 hours';
    case 'medium': return '1-2 days';
    case 'low': return '3-5 days';
    default: return '1-2 days';
  }
}

export default router; 