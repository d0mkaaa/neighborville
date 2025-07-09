import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  conversationType: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  groupName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  groupDescription: {
    type: String,
    trim: true,
    maxlength: 500
  },
  groupOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  participantSettings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    mutedUntil: {
      type: Date,
      default: null
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: 50
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'owner'],
      default: 'member'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  encryptionKey: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ conversationType: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ 'participantSettings.user': 1 });

conversationSchema.index({ participants: 1, conversationType: 1, status: 1 });

conversationSchema.virtual('unreadCount').get(function() {
  return 0;
});

conversationSchema.virtual('lastActivityFormatted').get(function() {
  if (!this.lastActivity) return 'Never';
  
  const now = new Date();
  const diffMs = now - this.lastActivity;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return this.lastActivity.toLocaleDateString();
});

conversationSchema.methods.addParticipant = function(userId, role = 'member') {
  const existingParticipant = this.participantSettings.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    return Promise.resolve(this);
  }
  
  this.participants.push(userId);
  
  this.participantSettings.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    lastReadAt: new Date()
  });
  
  return this.save();
};

conversationSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    p => p.toString() !== userId.toString()
  );

  this.participantSettings = this.participantSettings.filter(
    p => p.user.toString() !== userId.toString()
  );
  
  if (this.participants.length === 0) {
    this.status = 'deleted';
  }
  
  return this.save();
};

conversationSchema.methods.updateLastActivity = function(messageId = null) {
  this.lastActivity = new Date();
  this.messageCount += 1;
  
  if (messageId) {
    this.lastMessage = messageId;
  }
  
  return this.save();
};

conversationSchema.methods.markAsRead = function(userId) {
  const participantSetting = this.participantSettings.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participantSetting) {
    participantSetting.lastReadAt = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

conversationSchema.methods.toggleMute = function(userId, muteUntil = null) {
  const participantSetting = this.participantSettings.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participantSetting) {
    participantSetting.isMuted = !participantSetting.isMuted;
    participantSetting.mutedUntil = muteUntil;
    return this.save();
  }
  
  return Promise.resolve(this);
};

conversationSchema.methods.archive = function(userId) {
  const participantSetting = this.participantSettings.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participantSetting) {
    participantSetting.isArchived = true;
    return this.save();
  }
  
  return Promise.resolve(this);
};

conversationSchema.methods.unarchive = function(userId) {
  const participantSetting = this.participantSettings.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participantSetting) {
    participantSetting.isArchived = false;
    return this.save();
  }
  
  return Promise.resolve(this);
};

conversationSchema.statics.findDirectConversation = function(userId1, userId2) {
  return this.findOne({
    conversationType: 'direct',
    participants: { $all: [userId1, userId2] },
    status: { $ne: 'deleted' }
  });
};

conversationSchema.statics.getUserConversations = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    participants: userId,
    status: { $ne: 'deleted' },
    'participantSettings': {
      $elemMatch: {
        user: userId,
        isArchived: false
      }
    }
  })
  .populate('participants', 'username profileSettings.visibility gameData.level')
  .populate('lastMessage', 'content createdAt sender')
  .sort({ lastActivity: -1 })
  .skip(skip)
  .limit(limit)
  .exec();
};

conversationSchema.statics.getArchivedConversations = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    participants: userId,
    status: { $ne: 'deleted' },
    'participantSettings': {
      $elemMatch: {
        user: userId,
        isArchived: true
      }
    }
  })
  .populate('participants', 'username profileSettings.visibility gameData.level')
  .populate('lastMessage', 'content createdAt sender')
  .sort({ lastActivity: -1 })
  .skip(skip)
  .limit(limit)
  .exec();
};

conversationSchema.statics.createDirectConversation = function(userId1, userId2) {
  const conversation = new this({
    participants: [userId1, userId2],
    conversationType: 'direct',
    participantSettings: [
      {
        user: userId1,
        role: 'member',
        joinedAt: new Date(),
        lastReadAt: new Date()
      },
      {
        user: userId2,
        role: 'member',
        joinedAt: new Date(),
        lastReadAt: new Date()
      }
    ]
  });
  
  return conversation.save();
};

conversationSchema.statics.getOrCreateDirectConversation = async function(userId1, userId2) {
  let conversation = await this.findDirectConversation(userId1, userId2);
  
  if (!conversation) {
    conversation = await this.createDirectConversation(userId1, userId2);
  }
  
  return conversation;
};

conversationSchema.statics.getConversationWithUnreadCount = async function(conversationId, userId) {
  const Message = mongoose.model('Message');
  
  const conversation = await this.findById(conversationId)
    .populate('participants', 'username profileSettings.visibility gameData.level')
    .populate('lastMessage', 'content createdAt sender')
    .exec();
  
  if (!conversation) return null;
  
  const unreadCount = await Message.getUnreadCount(userId, conversationId);
  
  const conversationObj = conversation.toObject();
  conversationObj.unreadCount = unreadCount;
  
  return conversationObj;
};

conversationSchema.pre('save', function(next) {
  if (this.conversationType === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct conversations must have exactly 2 participants'));
  }
  
  if (this.conversationType === 'group' && this.participants.length > 2 && !this.groupName) {
    this.groupName = `Group Chat (${this.participants.length} members)`;
  }
  
  next();
});


conversationSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function() {
  if (!this.getQuery().status) {
    this.where({ status: { $ne: 'deleted' } });
  }
});

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation; 