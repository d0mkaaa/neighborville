import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false,
    minlength: 8
  },
  verified: {
    type: Boolean,
    default: false
  },
  twoFactorAuth: {
    enabled: { type: Boolean, default: false },
    secret: { type: String, default: null },
    backupCodes: [{ 
      code: String, 
      used: { type: Boolean, default: false },
      usedAt: { type: Date }
    }],
    setupCompleted: { type: Boolean, default: false },
    lastUsed: { type: Date }
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  permissions: {
    type: [String],
    default: []
  },
  moderationStats: {
    totalReports: { type: Number, default: 0 },
    resolvedReports: { type: Number, default: 0 },
    averageResolutionTime: { type: Number, default: 0 },
    lastModerationAction: { type: Date, default: null }
  },
  adminNotes: {
    type: String,
    default: ''
  },
  suspensions: [{
    reason: String,
    startDate: Date,
    endDate: Date,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
  }],
  warnings: [{
    reason: String,
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  }],
  appeals: [{
    suspensionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true, maxlength: 1000 },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'denied'], 
      default: 'pending' 
    },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminResponse: { type: String, maxlength: 500 }
  }],
  settings: {
    soundEnabled: { type: Boolean, default: true },
    musicEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true },
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' }
  },
  profileSettings: {
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    showBio: { type: Boolean, default: true },
    showStats: { type: Boolean, default: true },
    showActivity: { type: Boolean, default: true },
    showSocialLinks: { type: Boolean, default: false },
    showAchievements: { type: Boolean, default: true }
  },
  extendedProfile: {
    bio: { type: String, default: '' },
    displayName: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    socialLinks: {
      twitter: { type: String, default: '' },
      github: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' }
    },
    interests: [String],
    gamePreferences: {
      favoriteBuilding: { type: String, default: '' },
      playStyle: { type: String, default: '' }
    },
    avatar: { type: String, default: '' }
  },
  legalAcceptance: {
    termsOfService: {
      accepted: { type: Boolean, default: false },
      version: { type: String, default: null },
      acceptedAt: { type: Date, default: null },
      ipAddress: { type: String, default: null }
    },
    privacyPolicy: {
      accepted: { type: Boolean, default: false },
      version: { type: String, default: null },
      acceptedAt: { type: Date, default: null },
      ipAddress: { type: String, default: null }
    },
    marketingConsent: {
      accepted: { type: Boolean, default: false },
      acceptedAt: { type: Date, default: null },
      ipAddress: { type: String, default: null }
    }
  },
  gameData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  gameSaves: {
    type: [
      {
        id: String,
        playerName: String,
        data: mongoose.Schema.Types.Mixed,
        timestamp: Number,
        saveType: String,
        version: String
      }
    ],
    default: []
  },
  lastSave: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  ipHistory: [{
    ip: String,
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    userAgent: String,
    location: {
      country: String,
      region: String,
      city: String,
      timezone: String
    },
    isSuspicious: { type: Boolean, default: false },
    riskScore: { type: Number, default: 0 }
  }],
  deviceFingerprints: [{
    fingerprint: String,
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    deviceInfo: {
      browser: String,
      os: String,
      screen: String,
      timezone: String,
      language: String
    }
  }],
  securityFlags: {
    isVpnUser: { type: Boolean, default: false },
    hasMultipleAccounts: { type: Boolean, default: false },
    suspiciousActivity: { type: Boolean, default: false },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    lastRiskAssessment: { type: Date, default: Date.now }
  },
  ipSuspensions: [{
    ip: String,
    reason: String,
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    type: { type: String, enum: ['user', 'ip', 'device', 'global'], default: 'user' },
    severity: { type: String, enum: ['warning', 'temporary', 'permanent'], default: 'temporary' }
  }],
  activityStats: {
    totalLogins: { type: Number, default: 0 },
    totalGameSessions: { type: Number, default: 0 },
    totalPlayTime: { type: Number, default: 0 },
    averageSessionLength: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: Date.now },
    peakActivityHour: { type: Number, default: 12 },
    preferredDays: [String],
    streakDays: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 }
  },
  moderationHistory: {
    totalActions: { type: Number, default: 0 },
    warningsIssued: { type: Number, default: 0 },
    suspensionsIssued: { type: Number, default: 0 },
    appealsHandled: { type: Number, default: 0 },
    reportsResolved: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    lastModerationDate: { type: Date, default: null }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.calculateProfileCompletion = function() {
  let completed = 0;
  let total = 8;
  
  if (this.username) completed += 1;
  if (this.verified) completed += 1;
  
  if (this.extendedProfile?.bio && this.extendedProfile.bio.length > 10) completed += 1;
  if (this.profileSettings?.visibility) completed += 1;
  
  if (this.extendedProfile?.location) completed += 1;
  if (this.extendedProfile?.interests?.length > 0) completed += 1;
  if (this.extendedProfile?.gamePreferences?.favoriteBuilding) completed += 1;
  if (this.extendedProfile?.gamePreferences?.playStyle) completed += 1;
  
  return Math.round((completed / total) * 100);
};

userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

userSchema.methods.isModerator = function() {
  return this.role === 'moderator' || this.role === 'admin';
};

userSchema.methods.canModerate = function() {
  return this.role === 'admin' || this.role === 'moderator';
};

userSchema.methods.isSuspended = function() {
  const activeSuspension = this.suspensions.find(s => 
    s.isActive && s.endDate && new Date() < s.endDate
  );
  return !!activeSuspension;
};

userSchema.methods.getActiveSuspension = function() {
  return this.suspensions.find(s => 
    s.isActive && s.endDate && new Date() < s.endDate
  );
};

userSchema.methods.addWarning = function(reason, issuedBy, severity = 'medium') {
  this.warnings.push({
    reason,
    issuedBy,
    severity,
    issuedAt: new Date()
  });
  return this.save();
};

userSchema.methods.addSuspension = function(reason, endDate, issuedBy) {
  this.suspensions.forEach(s => s.isActive = false);
  
  this.suspensions.push({
    reason,
    startDate: new Date(),
    endDate,
    issuedBy,
    isActive: true
  });
  return this.save();
};

userSchema.methods.getRecentWarnings = function(days = 30) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.warnings.filter(w => w.issuedAt >= cutoff);
};

userSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.isAdmin();
};

userSchema.methods.trackIP = function(ip, userAgent, location = {}) {
  const existingIP = this.ipHistory.find(entry => entry.ip === ip);
  
  if (existingIP) {
    existingIP.lastSeen = new Date();
    existingIP.userAgent = userAgent;
    if (location.country) existingIP.location = location;
  } else {
    this.ipHistory.push({
      ip,
      userAgent,
      location,
      firstSeen: new Date(),
      lastSeen: new Date()
    });
  }
  
  const recentIPs = this.ipHistory.filter(entry => 
    new Date() - entry.lastSeen < 24 * 60 * 60 * 1000
  );
  
  if (recentIPs.length > 5) {
    this.securityFlags.suspiciousActivity = true;
    this.securityFlags.riskLevel = 'high';
  }
  
  return this.save();
};

userSchema.methods.trackDeviceFingerprint = function(fingerprint, deviceInfo) {
  const existing = this.deviceFingerprints.find(d => d.fingerprint === fingerprint);
  
  if (existing) {
    existing.lastSeen = new Date();
    existing.deviceInfo = deviceInfo;
  } else {
    this.deviceFingerprints.push({
      fingerprint,
      deviceInfo,
      firstSeen: new Date(),
      lastSeen: new Date()
    });
  }
  
  return this.save();
};

userSchema.methods.assessRisk = function() {
  let riskScore = 0;
  
  if (this.ipHistory.length > 10) riskScore += 20;
  
  if (this.securityFlags.suspiciousActivity) riskScore += 30;
  
  if (this.securityFlags.isVpnUser) riskScore += 15;
  
  if (this.securityFlags.hasMultipleAccounts) riskScore += 25;
  
  riskScore += Math.min(this.suspensions.length * 10, 30);
  
  if (riskScore >= 80) this.securityFlags.riskLevel = 'critical';
  else if (riskScore >= 60) this.securityFlags.riskLevel = 'high';
  else if (riskScore >= 30) this.securityFlags.riskLevel = 'medium';
  else this.securityFlags.riskLevel = 'low';
  
  this.securityFlags.lastRiskAssessment = new Date();
  return riskScore;
};

userSchema.methods.addIPSuspension = function(ip, reason, endDate, issuedBy, type = 'ip', severity = 'temporary') {
  this.ipSuspensions.forEach(s => {
    if (s.ip === ip) s.isActive = false;
  });
  
  this.ipSuspensions.push({
    ip,
    reason,
    endDate,
    issuedBy,
    type,
    severity,
    isActive: true
  });
  
  return this.save();
};

userSchema.methods.isIPSuspended = function(ip) {
  return this.ipSuspensions.some(s => 
    s.ip === ip && s.isActive && s.endDate && new Date() < s.endDate
  );
};

userSchema.methods.getActiveIPSuspensions = function() {
  return this.ipSuspensions.filter(s => 
    s.isActive && s.endDate && new Date() < s.endDate
  );
};

userSchema.methods.updateActivityStats = function(sessionLength = 0) {
  this.activityStats.totalLogins += 1;
  this.activityStats.totalGameSessions += 1;
  this.activityStats.totalPlayTime += sessionLength;
  this.activityStats.lastActivityDate = new Date();
  
  this.activityStats.averageSessionLength = 
    this.activityStats.totalPlayTime / this.activityStats.totalGameSessions;
  
  const currentHour = new Date().getHours();
  this.activityStats.peakActivityHour = currentHour;
  
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  if (!this.activityStats.preferredDays.includes(currentDay)) {
    this.activityStats.preferredDays.push(currentDay);
  }
  
  return this.save();
};

userSchema.methods.updateModerationStats = function(action, responseTime = 0) {
  this.moderationHistory.totalActions += 1;
  this.moderationHistory.lastModerationDate = new Date();
  
  switch (action) {
    case 'warning':
      this.moderationHistory.warningsIssued += 1;
      break;
    case 'suspension':
      this.moderationHistory.suspensionsIssued += 1;
      break;
    case 'appeal':
      this.moderationHistory.appealsHandled += 1;
      break;
    case 'report':
      this.moderationHistory.reportsResolved += 1;
      break;
  }
  
  if (responseTime > 0) {
    const totalTime = this.moderationHistory.averageResponseTime * (this.moderationHistory.totalActions - 1);
    this.moderationHistory.averageResponseTime = (totalTime + responseTime) / this.moderationHistory.totalActions;
  }
  
  return this.save();
};

userSchema.methods.generateTwoFactorSecret = function() {
  const speakeasy = require('speakeasy');
  const secret = speakeasy.generateSecret({
    name: `Neighborville (${this.username})`,
    issuer: 'Neighborville',
    length: 32
  });
  
  this.twoFactorAuth.secret = secret.base32;
  return secret;
};

userSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push({ code, used: false });
  }
  this.twoFactorAuth.backupCodes = codes;
  return codes.map(c => c.code);
};

userSchema.methods.verifyTwoFactorToken = function(token) {
  if (!this.twoFactorAuth.enabled || !this.twoFactorAuth.secret) {
    return false;
  }
  
  const speakeasy = require('speakeasy');
  
  if (token.length === 8) {
    const backupCode = this.twoFactorAuth.backupCodes.find(
      code => code.code === token.toUpperCase() && !code.used
    );
    
    if (backupCode) {
      backupCode.used = true;
      backupCode.usedAt = new Date();
      this.twoFactorAuth.lastUsed = new Date();
      return true;
    }
    return false;
  }
  
  const verified = speakeasy.totp.verify({
    secret: this.twoFactorAuth.secret,
    encoding: 'base32',
    token: token,
    window: 2
  });
  
  if (verified) {
    this.twoFactorAuth.lastUsed = new Date();
  }
  
  return verified;
};

userSchema.methods.enableTwoFactor = function() {
  this.twoFactorAuth.enabled = true;
  this.twoFactorAuth.setupCompleted = true;
  return this.save();
};

userSchema.methods.disableTwoFactor = function() {
  this.twoFactorAuth.enabled = false;
  this.twoFactorAuth.secret = null;
  this.twoFactorAuth.backupCodes = [];
  this.twoFactorAuth.setupCompleted = false;
  return this.save();
};

userSchema.methods.toProfile = function() {
  const activeSuspension = this.getActiveSuspension();
  
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    verified: this.verified,
    role: this.role,
    permissions: this.permissions,
    settings: this.settings,
    profileSettings: this.profileSettings,
    extendedProfile: this.extendedProfile,
    legalAcceptance: this.legalAcceptance,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
    lastSave: this.lastSave,
    profileCompletion: this.calculateProfileCompletion(),
    isSuspended: this.isSuspended(),
    activeSuspension: activeSuspension ? {
      id: activeSuspension._id,
      reason: activeSuspension.reason,
      startDate: activeSuspension.startDate,
      endDate: activeSuspension.endDate,
      issuedBy: activeSuspension.issuedBy?.username || 'System',
      timeRemaining: Math.max(0, new Date(activeSuspension.endDate) - new Date()),
      isPermanent: (new Date(activeSuspension.endDate) - new Date()) > (365 * 24 * 60 * 60 * 1000),
      canAppeal: !this.appeals.find(a => 
        a.suspensionId.toString() === activeSuspension._id.toString()
      ) || this.appeals.find(a => 
        a.suspensionId.toString() === activeSuspension._id.toString() && a.status === 'denied'
      ),
      appeal: this.appeals.find(a => 
        a.suspensionId.toString() === activeSuspension._id.toString()
      ) || null
    } : null,
    suspensionCount: this.suspensions.length,
    warningCount: this.warnings.length,
    securityFlags: this.securityFlags,
    riskScore: this.assessRisk(),
    ipHistory: this.ipHistory.slice(-5),
    deviceCount: this.deviceFingerprints.length,
    activeIPSuspensions: this.getActiveIPSuspensions(),
    activityStats: this.activityStats,
    moderationHistory: this.moderationHistory,
    accountAge: Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24)),
    lastSeenDays: Math.floor((new Date() - this.lastLogin) / (1000 * 60 * 60 * 24)),
    isNewUser: (new Date() - this.createdAt) < (7 * 24 * 60 * 60 * 1000),
    twoFactorAuth: {
      enabled: this.twoFactorAuth.enabled,
      setupCompleted: this.twoFactorAuth.setupCompleted,
      method: this.twoFactorAuth.method,
      lastUsed: this.twoFactorAuth.lastUsed,
      backupCodesRemaining: this.twoFactorAuth.backupCodes.filter(code => !code.used).length
    }
  };
};

const User = mongoose.model('User', userSchema);

export default User;
