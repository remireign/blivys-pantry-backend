const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ['Breakfast','Lunch','Dinner','Dessert','Snack'], default: 'Dinner' },
  difficulty:  { type: String, enum: ['Easy','Medium','Hard'], default: 'Easy' },
  prepTime:    { type: Number, default: 0 },   // minutes
  cookTime:    { type: Number, default: 0 },   // minutes
  servings:    { type: Number, default: 4 },
  ingredients: [{ type: String }],
  steps:       [{ type: String }],
  tips:        [{ type: String }],
  image:       { type: String },               // Cloudinary URL
  tags:        [{ type: String }],
  published:   { type: Boolean, default: false },
  emailSent:   { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

recipeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Recipe', recipeSchema);
