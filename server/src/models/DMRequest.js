import mongoose from 'mongoose';

const dmRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    maxLength: 200,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }
}, {
  timestamps: true
});

dmRequestSchema.index({ requester: 1, recipient: 1 });
dmRequestSchema.index({ recipient: 1, status: 1 });
dmRequestSchema.index({ requester: 1, status: 1 });
dmRequestSchema.index({ expiresAt: 1 });

dmRequestSchema.index(
  { requester: 1, recipient: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

dmRequestSchema.methods.accept = async function() {
  this.status = 'accepted';
  this.respondedAt = new Date();
  return await this.save();
};

dmRequestSchema.methods.decline = async function() {
  this.status = 'declined';
  this.respondedAt = new Date();
  return await this.save();
};

dmRequestSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

dmRequestSchema.statics.findPendingRequest = function(requesterId, recipientId) {
  return this.findOne({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending'
  });
};

dmRequestSchema.statics.findUserRequests = function(userId, status = null) {
  const query = {
    $or: [
      { requester: userId },
      { recipient: userId }
    ]
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('requester', 'username avatar level')
    .populate('recipient', 'username avatar level')
    .sort({ createdAt: -1 });
};

dmRequestSchema.statics.getPendingRequestsForUser = function(userId) {
  return this.find({
    recipient: userId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  })
    .populate('requester', 'username avatar level')
    .sort({ createdAt: -1 });
};

dmRequestSchema.statics.cleanupExpired = async function() {
  const expiredRequests = await this.find({
    status: 'pending',
    expiresAt: { $lt: new Date() }
  });
  
  await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'expired',
      respondedAt: new Date()
    }
  );
  
  return expiredRequests.length;
};

dmRequestSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'pending') {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

const DMRequest = mongoose.model('DMRequest', dmRequestSchema);

export default DMRequest; 