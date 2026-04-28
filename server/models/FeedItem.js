const mongoose = require('mongoose');

const feedItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sourceName: String,
  sourceUrl: String,
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
  itemUrl: String,
  type: {
    type: String,
    enum: ['article', 'video', 'alert', 'church'],
    default: 'article',
  },
  summary: String,
  thumbnailUrl: String,
  videoId: String,
  durationSeconds: { type: Number, default: null },
  publishedAt: Date,
  fetchedAt: { type: Date, default: Date.now },
  category: String,
  severity: {
    type: String,
    enum: ['critical', 'high', 'moderate', 'low', 'none'],
    default: 'none',
  },
  locationRelevance: { type: Number, default: 0 },
  importanceScore: { type: Number, default: 0 },
  approved: { type: Boolean, default: true },
  hidden: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  archivedReason: { type: String, enum: ['read', 'dismissed', 'age'], default: null },
  tags: [String],
  guid: { type: String, unique: true, sparse: true },
}, { timestamps: true });

feedItemSchema.index({ importanceScore: -1, publishedAt: -1 });
feedItemSchema.index({ archived: 1, publishedAt: -1 });
feedItemSchema.index({ type: 1, archived: 1 });

module.exports = mongoose.model('FeedItem', feedItemSchema);
