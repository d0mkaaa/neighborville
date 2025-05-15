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
  isGuest: {
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
  if (!this.isModified('password') || this.isGuest) {
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
  if (this.isGuest) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.createGuest = function() {
  const guestId = `guest_${Date.now()}`;
  const guestUsername = `Guest_${Math.floor(Math.random() * 1000)}`;
  
  return new this({
    username: guestUsername,
    email: `${guestId}@guest.neighborville`,
    isGuest: true,
    verified: true
  });
};

userSchema.methods.toProfile = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    verified: this.verified,
    isGuest: this.isGuest,
    settings: this.settings,
    profileSettings: this.profileSettings,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
    lastSave: this.lastSave
  };
};

const User = mongoose.model('User', userSchema);

export default User;
