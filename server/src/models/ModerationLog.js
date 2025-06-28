import mongoose from 'mongoose';

const moderationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  contentType: {
    type: String,
    enum: ['profile_bio', 'username', 'location', 'website', 'social_link', 'game_content', 'chat_message', 'other'],
    required: true
  },
  originalContent: {
    type: String,
    required: true,
    maxlength: 1000
  },
  cleanedContent: {
    type: String,
    default: ''
  },
  violationType: {
    type: String,
    enum: ['hate_speech', 'profanity', 'spam', 'personal_info', 'sexual_content', 'threats', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  action: {
    type: String,
    enum: ['blocked', 'cleaned', 'warned', 'temp_ban', 'permanent_ban', 'content_removed'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  flaggedWords: [String],
  flaggedPatterns: [String],
  detectedItems: [String],
  isAutomated: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

moderationLogSchema.index({ userId: 1, createdAt: -1 });
moderationLogSchema.index({ severity: 1, status: 1 });
moderationLogSchema.index({ violationType: 1 });
moderationLogSchema.index({ isAutomated: 1 });

export default mongoose.model('ModerationLog', moderationLogSchema); 