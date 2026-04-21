const mongoose = require('mongoose');
const crypto   = require('crypto');

const subscriberSchema = new mongoose.Schema({
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:       { type: String, trim: true },
  status:     { type: String, enum: ['active', 'unsubscribed'], default: 'active' },
  unsubToken: { type: String },   // unique token for one-click unsubscribe link
  createdAt:  { type: Date, default: Date.now }
});

// Auto-generate a secure unsubscribe token
subscriberSchema.pre('save', function(next) {
  if (!this.unsubToken) {
    this.unsubToken = crypto.randomBytes(20).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
