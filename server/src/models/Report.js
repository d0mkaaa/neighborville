import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    enum: [
      'inappropriate_profile', 
      'harassment', 
      'spam', 
      'hate_speech', 
      'impersonation', 
      'inappropriate_content', 
      'privacy_violation', 
      'cheating_exploitation'
    ],
    required: true
  },
  category: {
    type: String,
    enum: [
      'hate_speech', 'harassment', 'sexual_content', 'spam', 'personal_info', 
      'offensive_language', 'inappropriate_images', 'misleading_info',
      
      'targeted_harassment', 'bullying', 'threats', 'doxxing', 'stalking',
      'unwanted_contact', 'intimidation', 'cyberbullying',
      
      'spam_content', 'fake_account', 'promotional_abuse', 'bot_activity',
      'duplicate_account', 'scam_attempt', 'phishing', 'malicious_links',
      
      'racial_discrimination', 'religious_hatred', 'gender_discrimination', 
      'sexual_orientation_discrimination', 'disability_discrimination', 
      'age_discrimination', 'nationality_discrimination', 'other_discrimination',
      
      'celebrity_impersonation', 'user_impersonation', 'brand_impersonation',
      'government_impersonation', 'organization_impersonation', 'identity_theft',
      
      'violent_content', 'disturbing_content', 'illegal_content',
      'graphic_content', 'self_harm', 'drug_content', 'weapon_content',
      
      'personal_info_sharing', 'private_photos', 'contact_info', 'location_sharing',
      'financial_info', 'medical_info', 'family_info',
      
      'game_cheating', 'exploit_abuse', 'unfair_advantage', 'account_sharing',
      'real_money_trading', 'griefing', 'game_disruption',
      
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 1000
  },
  evidence: {
    type: String,
    maxlength: 500
  },
  specificContent: {
    type: {
      type: String,
      enum: ['bio', 'location', 'website', 'interests', 'gamePreferences']
    },
    content: String
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  estimatedReviewTime: {
    type: String,
    enum: ['immediate', '1-2 hours', '24 hours', '2-3 days'],
    default: '24 hours'
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'],
    default: 'pending'
  },
  assignedModerator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolution: {
    action: {
      type: String,
      enum: ['no_action', 'warning_issued', 'content_removed', 'temp_ban', 'permanent_ban', 'account_restricted'],
      default: null
    },
    reason: String,
    notes: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  tags: [String],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  relatedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

reportSchema.index({ reportedUserId: 1, status: 1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ status: 1, priority: -1, createdAt: -1 });
reportSchema.index({ reportType: 1, category: 1 });
reportSchema.index({ assignedModerator: 1, status: 1 });
reportSchema.index({ severity: 1, priority: 1 });

reportSchema.index({ 
  reporterId: 1, 
  reportedUserId: 1, 
  createdAt: 1 
}, { 
  partialFilterExpression: { 
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
  } 
});

reportSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60));
});

reportSchema.methods.isUrgent = function() {
  return this.severity === 'critical' || this.priority === 'urgent';
};

reportSchema.methods.calculatePriority = function() {
  let priority = 'medium';
  let severity = 'medium';
  
  const criticalCategories = [
    'threats', 'doxxing', 'self_harm', 'illegal_content', 
    'identity_theft', 'financial_info', 'medical_info'
  ];
  
  const highCategories = [
    'hate_speech', 'racial_discrimination', 'religious_hatred', 
    'targeted_harassment', 'bullying', 'stalking', 'cyberbullying',
    'violent_content', 'graphic_content', 'drug_content'
  ];
  
  const mediumCategories = [
    'harassment', 'sexual_content', 'inappropriate_images',
    'scam_attempt', 'phishing', 'fake_account', 'impersonation'
  ];
  
  if (criticalCategories.includes(this.category)) {
    severity = 'critical';
    priority = 'urgent';
  } else if (highCategories.includes(this.category)) {
    severity = 'high';
    priority = 'high';
  } else if (mediumCategories.includes(this.category)) {
    severity = 'medium';
    priority = 'medium';
  } else {
    severity = 'low';
    priority = 'low';
  }
  
  if (this.relatedReports && this.relatedReports.length > 2) {
    priority = 'urgent';
    severity = 'critical';
  }
  
  this.priority = priority;
  this.severity = severity;
  
  switch (priority) {
    case 'urgent':
      this.estimatedReviewTime = 'immediate';
      break;
    case 'high':
      this.estimatedReviewTime = '1-2 hours';
      break;
    case 'medium':
      this.estimatedReviewTime = '24 hours';
      break;
    default:
      this.estimatedReviewTime = '2-3 days';
  }
  
  return { priority, severity };
};

export default mongoose.model('Report', reportSchema); 