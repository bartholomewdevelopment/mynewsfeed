const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['rss', 'youtube', 'website', 'emergency', 'manual', 'church'],
    required: true,
  },
  url: { type: String, required: true },
  category: { type: String, default: 'general' },
  approved: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  includeKeywords: { type: [String], default: [] },
  excludeKeywords: { type: [String], default: [] },
  priority: { type: Number, default: 5 },
  locationTags: { type: [String], default: [] },
  channelId: String,
  notes: String,
  lastFetched: Date,
  fetchError: String,
}, { timestamps: true });

module.exports = mongoose.model('Source', sourceSchema);
