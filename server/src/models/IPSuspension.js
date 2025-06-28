import mongoose from 'mongoose';

const ipSuspensionSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  type: {
    type: String,
    enum: ['user', 'ip', 'device', 'global'],
    default: 'ip'
  },
  severity: {
    type: String,
    enum: ['warning', 'temporary', 'permanent'],
    default: 'temporary'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  affectedUsers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    detectedAt: { type: Date, default: Date.now },
    userAgent: String,
    deviceFingerprint: String
  }],
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String,
    isp: String
  },
  metadata: {
    userAgent: String,
    deviceFingerprint: String,
    vpnDetected: { type: Boolean, default: false },
    proxyDetected: { type: Boolean, default: false },
    riskScore: { type: Number, default: 0 }
  },
  appealable: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, { 
  timestamps: true,
  indexes: [
    { ip: 1, isActive: 1 },
    { endDate: 1, isActive: 1 },
    { issuedBy: 1 },
    { targetUserId: 1 }
  ]
});
  
ipSuspensionSchema.methods.isCurrentlyActive = function() {
  return this.isActive && new Date() < this.endDate;
};

ipSuspensionSchema.methods.getTimeRemaining = function() {
  if (!this.isCurrentlyActive()) return 0;
  return Math.max(0, this.endDate - new Date());
};

ipSuspensionSchema.methods.isPermanent = function() {
  const tenYears = 10 * 365 * 24 * 60 * 60 * 1000;
  return (this.endDate - this.startDate) > tenYears;
};

ipSuspensionSchema.methods.addAffectedUser = function(userId, userAgent, deviceFingerprint) {
  const existing = this.affectedUsers.find(u => u.userId.toString() === userId.toString());
  if (!existing) {
    this.affectedUsers.push({
      userId,
      userAgent,
      deviceFingerprint,
      detectedAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

ipSuspensionSchema.statics.findActiveForIP = function(ip) {
  return this.find({
    ip,
    isActive: true,
    endDate: { $gt: new Date() }
  }).populate('issuedBy', 'username').populate('targetUserId', 'username email');
};

ipSuspensionSchema.statics.findAffectedUsers = function(ip) {
  return this.aggregate([
    { $match: { ip, isActive: true } },
    { $unwind: '$affectedUsers' },
    { $lookup: {
        from: 'users',
        localField: 'affectedUsers.userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $project: {
        userId: '$affectedUsers.userId',
        username: '$user.username',
        email: '$user.email',
        detectedAt: '$affectedUsers.detectedAt',
        suspensionReason: '$reason',
        suspensionEnd: '$endDate'
      }
    }
  ]);
};

const IPSuspension = mongoose.model('IPSuspension', ipSuspensionSchema);

export default IPSuspension; 