const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const chefSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['chef', 'admin'], default: 'chef' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
chefSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password comparison helper
chefSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Chef', chefSchema);
