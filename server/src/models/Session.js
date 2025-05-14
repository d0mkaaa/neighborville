import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  clientInfo: {
    userAgent: { type: String },
    ip: { type: String },
    device: { type: String }
  }
});

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1 });

sessionSchema.methods.isValid = function() {
  return new Date() < this.expiresAt;
};

sessionSchema.methods.refresh = function(expiryDays = 7) {
  this.lastActive = new Date();
  const newExpiryDate = new Date();
  newExpiryDate.setDate(newExpiryDate.getDate() + expiryDays);
  this.expiresAt = newExpiryDate;
  return this;
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;
