import ModerationLog from '../models/ModerationLog.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

class ModerationService {
  static PROHIBITED_WORDS = [
    'nigger', 'nigga', 'nazi', 'hitler', 'racist', 'sexist', 'homophobic', 'transphobic', 'bigot',
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'whore', 'cunt',
    'porn', 'xxx', 'nude', 'naked', 'sexual', 'erotic', 'orgasm',
    'kill', 'murder', 'death threat', 'violence', 'harm'
  ];

  static ALLOWED_WORDS = [
    'dom', 'domka', 'nick', 'dick', 'cox', 'gay', 'lesbian', 'trans', 'transgender'
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

  static moderateContent(text, contentType = 'other') {
    if (!text || typeof text !== 'string') {
      return { isValid: true };
    }

    const originalText = text.trim();
    let cleanedText = originalText;
    const flaggedWords = [];
    const flaggedPatterns = [];
    const detectedItems = [];
    let violationType = 'other';
    
    const lowerText = originalText.toLowerCase();
    
    if (originalText.length > 1000) {
      return {
        isValid: false,
        reason: 'Content is too long. Please keep it under 1000 characters.',
        severity: 'medium',
        violationType: 'spam',
        cleanedText: originalText.substring(0, 1000) + '...',
        detectedItems: ['content too long']
      };
    }

    for (const word of this.PROHIBITED_WORDS) {
      const lowerWord = word.toLowerCase();
      
      if (this.ALLOWED_WORDS.includes(lowerWord)) continue;
      
      const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      
      if (wordRegex.test(lowerText)) {
        flaggedWords.push(word);
        detectedItems.push(`inappropriate word: "${word}"`);
        
        if (['nigger', 'nigga', 'nazi', 'hitler'].includes(lowerWord)) {
          violationType = 'hate_speech';
        } else if (['fuck', 'shit', 'bitch', 'asshole'].includes(lowerWord)) {
          violationType = 'profanity';
        } else if (['porn', 'xxx', 'nude', 'sexual'].includes(lowerWord)) {
          violationType = 'sexual_content';
        } else if (['kill', 'murder', 'death threat'].includes(lowerWord)) {
          violationType = 'threats';
        }
        
        cleanedText = cleanedText.replace(wordRegex, '***');
      }
    }

    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      const matches = Array.from(originalText.matchAll(new RegExp(pattern.source, pattern.flags + 'g')));
      
      if (matches.length > 0) {
        matches.forEach(match => {
          flaggedPatterns.push(match[0]);
          detectedItems.push(`suspicious pattern: "${match[0]}"`);
          
          if (pattern.source.includes('phone|email|credit')) {
            violationType = 'personal_info';
          } else if (pattern.source.includes('sex|porn|nude')) {
            violationType = 'sexual_content';
          } else {
            violationType = 'spam';
          }
          
          cleanedText = cleanedText.replace(match[0], '*'.repeat(match[0].length));
        });
      }
    }

    if (flaggedWords.length > 0 || flaggedPatterns.length > 0) {
      cleanedText = cleanedText.replace(/\*+/g, '***').replace(/\s+/g, ' ').trim();
      const severity = this.calculateSeverity(violationType, flaggedWords, flaggedPatterns);

      return {
        isValid: false,
        reason: flaggedWords.length > 0 
          ? `Content contains inappropriate language: ${flaggedWords.join(', ')}`
          : 'Content contains suspicious patterns that aren\'t allowed',
        severity,
        violationType,
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
        violationType: 'spam',
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
        severity: 'medium',
        violationType: 'spam',
        detectedItems: ['repetitive content']
      };
    }

    return { isValid: true };
  }

  static calculateSeverity(violationType, flaggedWords, flaggedPatterns) {
    if (violationType === 'hate_speech' || violationType === 'threats') {
      return 'critical';
    }
    
    if (violationType === 'sexual_content' || violationType === 'personal_info') {
      return 'high';
    }
    
    if (flaggedWords.length > 3 || flaggedPatterns.length > 2) {
      return 'high';
    }
    
    if (violationType === 'profanity') {
      return 'medium';
    }
    
    return 'low';
  }

  static async logModerationAction(userId, content, contentType, moderationResult, moderatorId = null) {
    try {
      console.log(`🔍 ModerationService.logModerationAction called:`);
      console.log(`   - userId: ${userId}`);
      console.log(`   - contentType: ${contentType}`);
      console.log(`   - moderatorId: ${moderatorId}`);
      console.log(`   - moderationResult:`, moderationResult);
      
      const contentString = typeof content === 'string' ? content : JSON.stringify(content);
      
      const log = new ModerationLog({
        userId,
        moderatorId,
        contentType,
        originalContent: contentString.substring(0, 1000),
        cleanedContent: moderationResult.cleanedText || '',
        violationType: moderationResult.violationType || 'other',
        severity: moderationResult.severity || 'low',
        action: moderationResult.cleanedText ? 'cleaned' : 'blocked',
        reason: moderationResult.reason || 'Content moderation triggered',
        flaggedWords: moderationResult.flaggedWords || [],
        flaggedPatterns: moderationResult.flaggedPatterns || [],
        detectedItems: moderationResult.detectedItems || [],
        isAutomated: !moderatorId
      });

      console.log(`🔍 About to save ModerationLog:`, log.toObject());
      
      await log.save();
      
      console.log(`✅ ModerationLog saved successfully with ID: ${log._id}`);

      await this.updateUserModerationHistory(userId, moderationResult.severity);
      
      return log;
    } catch (error) {
      console.error('❌ Error logging moderation action:', error);
      return null;
    }
  }

  static async updateUserModerationHistory(userId, severity) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      if (['medium', 'high', 'critical'].includes(severity)) {
        await user.addWarning(
          `Automated content moderation: ${severity} severity violation`,
          null,
          severity === 'critical' ? 'high' : severity
        );
      }

      const recentWarnings = user.getRecentWarnings(7);
      const highSeverityWarnings = recentWarnings.filter(w => w.severity === 'high').length;
      
      if (severity === 'critical' || highSeverityWarnings >= 3) {
        const suspensionEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.addSuspension(
          severity === 'critical' 
            ? 'Critical content violation - automated suspension'
            : 'Multiple high-severity violations - automated suspension',
          suspensionEnd,
          null
        );
      }

    } catch (error) {
      console.error('Error updating user moderation history:', error);
    }
  }

  static async createReport(reportData) {
    try {
      const existingReport = await Report.findOne({
        reporterId: reportData.reporterId,
        reportedUserId: reportData.reportedUserId,
        reportType: reportData.reportType,
        category: reportData.category,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (existingReport) {
        throw new Error('You have already submitted a similar report for this user recently');
      }

      const report = new Report(reportData);
      
      const { priority, severity } = report.calculatePriority();
      
      const relatedReports = await Report.find({
        reportedUserId: reportData.reportedUserId,
        status: { $in: ['pending', 'under_review'] }
      }).select('_id');
      
      report.relatedReports = relatedReports.map(r => r._id);
      
      if (relatedReports.length >= 2) {
        report.status = 'escalated';
        report.priority = 'urgent';
        report.severity = 'critical';
      }

      await report.save();
      return report;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  static async getModerationLogs(filters = {}, page = 1, limit = 50) {
    try {
      console.log(`🔍 ModerationService.getModerationLogs called with filters:`, filters);
      
      const skip = (page - 1) * limit;
      const query = {};

      if (filters.severity) query.severity = filters.severity;
      if (filters.violationType) query.violationType = filters.violationType;
      if (filters.isAutomated !== undefined) query.isAutomated = filters.isAutomated;
      if (filters.status) query.status = filters.status;
      if (filters.userId) query.userId = filters.userId;

      console.log(`🔍 Final query:`, query);
      console.log(`🔍 Skip: ${skip}, Limit: ${limit}`);

      const logs = await ModerationLog.find(query)
        .populate('userId', 'username email')
        .populate('moderatorId', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ModerationLog.countDocuments(query);
      
      console.log(`🔍 Found ${logs.length} logs out of ${total} total`);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error getting moderation logs:', error);
      throw error;
    }
  }

  static async getReports(filters = {}, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      const query = {};

      if (filters.status) query.status = filters.status;
      if (filters.reportType) query.reportType = filters.reportType;
      if (filters.severity) query.severity = filters.severity;
      if (filters.priority) query.priority = filters.priority;
      if (filters.assignedModerator) query.assignedModerator = filters.assignedModerator;

      const reports = await Report.find(query)
        .populate('reporterId', 'username')
        .populate('reportedUserId', 'username email')
        .populate('assignedModerator', 'username')
        .populate('resolution.resolvedBy', 'username')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Report.countDocuments(query);

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  }

  static async resolveReport(reportId, resolution, moderatorId) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      report.status = 'resolved';
      report.resolution = {
        ...resolution,
        resolvedBy: moderatorId,
        resolvedAt: new Date()
      };

      await report.save();

      const moderator = await User.findById(moderatorId);
      if (moderator) {
        moderator.moderationStats.resolvedReports += 1;
        moderator.moderationStats.lastModerationAction = new Date();
        await moderator.save();
      }

      return report;
    } catch (error) {
      console.error('Error resolving report:', error);
      throw error;
    }
  }

  static async assignReport(reportId, moderatorId) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      report.assignedModerator = moderatorId;
      report.status = 'under_review';
      await report.save();

      return report;
    } catch (error) {
      console.error('Error assigning report:', error);
      throw error;
    }
  }
}

export default ModerationService; 