const mongoose = require('mongoose');

const keywordRuleSchema = new mongoose.Schema({
  keyword: { type: String, required: true, lowercase: true, trim: true },
  type: { type: String, enum: ['include', 'exclude'], required: true },
  weight: { type: Number, default: 10 },
  category: { type: String, default: 'general' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('KeywordRule', keywordRuleSchema);
