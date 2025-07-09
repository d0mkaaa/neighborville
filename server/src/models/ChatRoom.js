import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  roomType: {
    type: String,
    enum: ['global', 'regional', 'topic', 'level-based', 'private'],
    default: 'global'
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    maxParticipants: {
      type: Number,
      default: 1000
    },
    slowMode: {
      enabled: {
        type: Boolean,
        default: false
      },
      cooldownSeconds: {
        type: Number,
        default: 5
      }
    },
    requiresApproval: {
      type: Boolean,
      default: false
    },
    allowImages: {
      type: Boolean,
      default: true
    },
    allowLinks: {
      type: Boolean,
      default: true
    },
    profanityFilter: {
      type: Boolean,
      default: true
    }
  },
  accessRequirements: {
    minLevel: {
      type: Number,
      default: 1
    },
    maxLevel: {
      type: Number,
      default: null
    },
    requiredAchievements: [{
      type: String
    }],
    regionRestriction: {
      type: String,
      default: null
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    permissions: [{
      type: String,
      enum: ['kick', 'ban', 'mute', 'delete_messages', 'manage_settings'],
      default: ['kick', 'mute', 'delete_messages']
    }],
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    messageCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'away', 'busy', 'invisible'],
      default: 'active'
    }
  }],
  bannedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bannedAt: {
      type: Date,
      default: Date.now
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500
    },
    expiresAt: {
      type: Date,
      default: null
    }
  }],
  mutedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    mutedAt: {
      type: Date,
      default: Date.now
    },
    mutedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      maxlength: 500
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }],
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalParticipants: {
      type: Number,
      default: 0
    },
    activeParticipants: {
      type: Number,
      default: 0
    },
    peakParticipants: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'maintenance', 'deleted'],
    default: 'active'
  },
  scheduledEvents: [{
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  welcomeMessage: {
    type: String,
    maxlength: 500,
    default: null
  },
  rules: [{
    type: String,
    maxlength: 200
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

chatRoomSchema.index({ roomType: 1, status: 1 });
chatRoomSchema.index({ 'participants.user': 1 });
chatRoomSchema.index({ 'bannedUsers.user': 1 });
chatRoomSchema.index({ 'mutedUsers.user': 1 });
chatRoomSchema.index({ 'stats.lastActivity': -1 });
chatRoomSchema.index({ 'settings.isPublic': 1, status: 1 });

chatRoomSchema.virtual('currentParticipantCount').get(function() {
  return this.participants.length;
});

chatRoomSchema.virtual('onlineParticipantCount').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.participants.filter(p => p.lastActivity > fiveMinutesAgo).length;
});

chatRoomSchema.methods.addParticipant = function(userId) {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    existingParticipant.lastActivity = new Date();
    existingParticipant.status = 'active';
  } else {
    this.participants.push({
      user: userId,
      joinedAt: new Date(),
      lastActivity: new Date(),
      status: 'active'
    });
    
    this.stats.totalParticipants = Math.max(this.stats.totalParticipants, this.participants.length);
    this.stats.peakParticipants = Math.max(this.stats.peakParticipants, this.participants.length);
  }
  
  this.stats.activeParticipants = this.onlineParticipantCount;
  return this.save();
};

chatRoomSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    p => p.user.toString() !== userId.toString()
  );
  
  this.stats.activeParticipants = this.onlineParticipantCount;
  return this.save();
};

chatRoomSchema.methods.updateParticipantActivity = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.lastActivity = new Date();
    participant.messageCount += 1;
    this.stats.lastActivity = new Date();
    this.stats.totalMessages += 1;
    return this.save();
  }
  
  return Promise.resolve(this);
};

chatRoomSchema.methods.banUser = function(userId, moderatorId, reason, duration = null) {
  this.removeParticipant(userId);
  
  const banData = {
    user: userId,
    bannedBy: moderatorId,
    reason: reason,
    bannedAt: new Date()
  };
  
  if (duration) {
    banData.expiresAt = new Date(Date.now() + duration);
  }
  
  this.bannedUsers.push(banData);
  return this.save();
};

chatRoomSchema.methods.unbanUser = function(userId) {
  this.bannedUsers = this.bannedUsers.filter(
    ban => ban.user.toString() !== userId.toString()
  );
  return this.save();
};

chatRoomSchema.methods.muteUser = function(userId, moderatorId, reason, duration) {
  const muteData = {
    user: userId,
    mutedBy: moderatorId,
    reason: reason,
    mutedAt: new Date(),
    expiresAt: new Date(Date.now() + duration)
  };
  
  this.mutedUsers = this.mutedUsers.filter(
    mute => mute.user.toString() !== userId.toString()
  );
  
  this.mutedUsers.push(muteData);
  return this.save();
};

chatRoomSchema.methods.unmuteUser = function(userId) {
  this.mutedUsers = this.mutedUsers.filter(
    mute => mute.user.toString() !== userId.toString()
  );
  return this.save();
};

chatRoomSchema.methods.isUserBanned = function(userId) {
  const ban = this.bannedUsers.find(ban => 
    ban.user.toString() === userId.toString() &&
    (!ban.expiresAt || ban.expiresAt > new Date())
  );
  return !!ban;
};

chatRoomSchema.methods.isUserMuted = function(userId) {
  const mute = this.mutedUsers.find(mute => 
    mute.user.toString() === userId.toString() &&
    mute.expiresAt > new Date()
  );
  return !!mute;
};

chatRoomSchema.methods.canUserAccess = function(user) {
  if (this.isUserBanned(user._id)) {
    return { allowed: false, reason: 'User is banned from this room' };
  }
  
  if (user.gameData && user.gameData.level < this.accessRequirements.minLevel) {
    return { 
      allowed: false, 
      reason: `Minimum level ${this.accessRequirements.minLevel} required` 
    };
  }
  
  if (this.accessRequirements.maxLevel && user.gameData && 
      user.gameData.level > this.accessRequirements.maxLevel) {
    return { 
      allowed: false, 
      reason: `Maximum level ${this.accessRequirements.maxLevel} exceeded` 
    };
  }
  
  if (this.participants.length >= this.settings.maxParticipants) {
    return { allowed: false, reason: 'Room is at maximum capacity' };
  }
  
  return { allowed: true };
};

chatRoomSchema.methods.addModerator = function(userId, permissions, assignedBy) {
  this.moderators = this.moderators.filter(
    mod => mod.user.toString() !== userId.toString()
  );
  
  this.moderators.push({
    user: userId,
    permissions: permissions,
    assignedAt: new Date(),
    assignedBy: assignedBy
  });
  
  return this.save();
};

chatRoomSchema.methods.removeModerator = function(userId) {
  this.moderators = this.moderators.filter(
    mod => mod.user.toString() !== userId.toString()
  );
  return this.save();
};

chatRoomSchema.methods.isUserModerator = function(userId) {
  return this.moderators.some(mod => mod.user.toString() === userId.toString()) ||
         (this.owner && this.owner.toString() === userId.toString());
};

chatRoomSchema.statics.getPublicRooms = function(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    'settings.isPublic': true,
    status: 'active'
  })
  .populate('owner', 'username')
  .sort({ 'stats.activeParticipants': -1, 'stats.lastActivity': -1 })
  .skip(skip)
  .limit(limit)
  .exec();
};

chatRoomSchema.statics.getRoomsByType = function(roomType, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    roomType: roomType,
    'settings.isPublic': true,
    status: 'active'
  })
  .populate('owner', 'username')
  .sort({ 'stats.activeParticipants': -1 })
  .skip(skip)
  .limit(limit)
  .exec();
};

chatRoomSchema.statics.getUserRooms = function(userId) {
  return this.find({
    'participants.user': userId,
    status: 'active'
  })
  .populate('owner', 'username')
  .sort({ 'stats.lastActivity': -1 })
  .exec();
};

chatRoomSchema.statics.getGlobalRoom = function() {
  return this.findOne({
    roomType: 'global',
    status: 'active'
  }).populate('owner', 'username');
};

chatRoomSchema.statics.createGlobalRoom = function() {
  return this.create({
    name: 'Global Chat',
    description: 'Welcome to the global chat! Connect with mayors from around the world.',
    roomType: 'global',
    settings: {
      isPublic: true,
      maxParticipants: 1000,
      slowMode: {
        enabled: false,
        cooldownSeconds: 3
      },
      profanityFilter: true
    },
    welcomeMessage: 'Welcome to NeighborVille Global Chat! Please be respectful to other players.',
    rules: [
      'Be respectful to other players',
      'No spam or excessive messages',
      'No inappropriate content',
      'Help new players when possible',
      'Have fun building your cities!'
    ]
  });
};

chatRoomSchema.pre('save', function(next) {
  const now = new Date();
  
  this.bannedUsers = this.bannedUsers.filter(ban => 
    !ban.expiresAt || ban.expiresAt > now
  );
  
  this.mutedUsers = this.mutedUsers.filter(mute => 
    mute.expiresAt > now
  );
  
  next();
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export default ChatRoom; 