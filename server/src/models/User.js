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
    bio: { type: String, default: '' }
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

userSchema.methods.toProfile = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    verified: this.verified,
    settings: this.settings,
    profileSettings: this.profileSettings,
    legalAcceptance: this.legalAcceptance,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
    lastSave: this.lastSave
  };
};

const User = mongoose.model('User', userSchema);

export default User;
