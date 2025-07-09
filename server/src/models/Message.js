import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageType: {
    type: String,
    enum: ['direct', 'global', 'system'],
    required: true,
    default: 'direct'
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: function() {
      return this.messageType === 'direct';
    }
  },
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: function() {
      return this.messageType === 'global';
    }
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'deleted'],
    default: 'sent'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  metadata: {
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    },
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'file', 'link'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      filename: String,
      size: Number,
      mimeType: String
    }]
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isModerated: {
    type: Boolean,
    default: false
  },
  moderationReason: {
    type: String,
    default: null
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ messageType: 1, createdAt: -1 });
messageSchema.index({ status: 1 });

messageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
});

messageSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

messageSchema.virtual('relativeTime').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return this.formattedDate;
});

messageSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.some(read => read.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
  return this.save();
};

messageSchema.methods.markAsEdited = function() {
  this.metadata.edited = true;
  this.metadata.editedAt = new Date();
  return this.save();
};

messageSchema.methods.softDelete = function() {
  this.status = 'deleted';
  this.metadata.deletedAt = new Date();
  return this.save();
};

messageSchema.methods.moderate = function(reason, moderatorId) {
  this.isModerated = true;
  this.moderationReason = reason;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  return this.save();
};

messageSchema.statics.getConversationMessages = function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    conversation: conversationId,
    status: { $ne: 'deleted' }
  })
  .populate('sender', 'username profileSettings.visibility')
  .populate('replyTo', 'content sender')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .exec();
};

messageSchema.statics.getGlobalChatMessages = function(chatRoomId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ 
    chatRoom: chatRoomId,
    status: { $ne: 'deleted' },
    isModerated: false
  })
  .populate('sender', 'username profileSettings.visibility gameData.level')
  .populate('replyTo', 'content sender')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .exec();
};

messageSchema.statics.getUnreadCount = function(userId, conversationId) {
  return this.countDocuments({
    conversation: conversationId,
    sender: { $ne: userId },
    status: { $ne: 'deleted' },
    'readBy.user': { $ne: userId }
  });
};

messageSchema.statics.markConversationAsRead = function(userId, conversationId) {
  return this.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      status: { $ne: 'deleted' },
      'readBy.user': { $ne: userId }
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date()
        }
      }
    }
  );
};

messageSchema.pre('save', function(next) {
  if (this.content) {
    this.content = this.content.trim();
    
    if (this.content.length === 0) {
      return next(new Error('Message content cannot be empty'));
    }
    
    const profanityPattern = /\b(fuck|shit|damn|ass|bitch|bastard|crap|piss|dick|cock|pussy|tits|whore|slut|nigger|faggot|retard)\b/gi;
    if (profanityPattern.test(this.content)) {
      this.isModerated = true;
      this.moderationReason = 'Automated profanity filter';
    }
  }
  
  next();
});

messageSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function() {
  if (!this.getQuery().status) {
    this.where({ status: { $ne: 'deleted' } });
  }
});

const Message = mongoose.model('Message', messageSchema);
export default Message; 