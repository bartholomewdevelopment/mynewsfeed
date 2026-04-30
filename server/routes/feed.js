const router = require('express').Router();
const auth = require('../middleware/auth');
const FeedItem = require('../models/FeedItem');
const { refreshAllFeeds, getRefreshStatus } = require('../services/feedRefresher');
const { extractArticle } = require('../services/articleExtractor');

const FIVE_DAYS    = 5  * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

// Main feed — fresh, unarchived items only
router.get('/', auth, async (req, res) => {
  const { type, category, excludeCategory, limit = 500, page = 1, local } = req.query;

  const cutoff = new Date(Date.now() - FIVE_DAYS);
  const eightDaysAhead = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);

  const query = {
    approved: true,
    archived: { $ne: true },
    publishedAt: { $gte: cutoff, $lte: eightDaysAhead },
  };
  if (type) query.type = type;
  if (category) query.category = category;
  if (excludeCategory) query.category = { $ne: excludeCategory };
  if (local === '1') query.locationRelevance = { $gt: 0 };
  if (local === '0') query.locationRelevance = 0;

  const items = await FeedItem.find(query)
    .sort({ importanceScore: -1, publishedAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  res.json(items);
});

// Alerts — no age cutoff, show all active unarchived alerts
router.get('/alerts', auth, async (req, res) => {
  const alerts = await FeedItem.find({ type: 'alert', archived: { $ne: true } })
    .sort({ importanceScore: -1, publishedAt: -1 })
    .limit(20);
  res.json(alerts);
});

// Archive — everything read, dismissed, or aged out
router.get('/archive', auth, async (req, res) => {
  const { type, page = 1, limit = 40, q } = req.query;
  const query = { archived: true };
  if (type && type !== 'all') query.type = type;
  if (q) query.title = { $regex: q, $options: 'i' };

  const [items, total] = await Promise.all([
    FeedItem.find(query)
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit)),
    FeedItem.countDocuments(query),
  ]);

  res.json({ items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// Refresh status — client polls this to know when fetch is done
router.get('/refresh-status', auth, (req, res) => {
  res.json(getRefreshStatus());
});

// Batch archive a list of item IDs
router.post('/batch-archive', auth, async (req, res) => {
  const { ids, reason = 'read' } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids required' });
  await FeedItem.updateMany(
    { _id: { $in: ids } },
    { $set: { archived: true, read: reason === 'read', archivedReason: reason } }
  );
  res.json({ archived: ids.length });
});

// Mark all visible feed items as read (archives them all at once)
router.post('/mark-all-read', auth, async (req, res) => {
  const cutoff = new Date(Date.now() - FOURTEEN_DAYS);
  const result = await FeedItem.updateMany(
    { archived: { $ne: true }, approved: true, publishedAt: { $gte: cutoff } },
    { $set: { archived: true, read: true, archivedReason: 'read' } }
  );
  res.json({ archived: result.modifiedCount });
});

// Mark read → archive
router.patch('/:id/read', auth, async (req, res) => {
  const item = await FeedItem.findByIdAndUpdate(
    req.params.id,
    { read: true, archived: true, archivedReason: 'read' },
    { new: true }
  );
  res.json(item);
});

// Dismiss → archive
router.patch('/:id/hide', auth, async (req, res) => {
  const item = await FeedItem.findByIdAndUpdate(
    req.params.id,
    { hidden: true, archived: true, archivedReason: 'dismissed' },
    { new: true }
  );
  res.json(item);
});

// Restore from archive
router.patch('/:id/restore', auth, async (req, res) => {
  const item = await FeedItem.findByIdAndUpdate(
    req.params.id,
    { archived: false, hidden: false, read: false, archivedReason: null },
    { new: true }
  );
  res.json(item);
});

router.patch('/:id/approve', auth, async (req, res) => {
  const item = await FeedItem.findByIdAndUpdate(
    req.params.id,
    { approved: true, archived: false, hidden: false },
    { new: true }
  );
  res.json(item);
});

// Extract full article text via Readability — returns clean prose, no ads
router.get('/article-text', auth, async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const article = await extractArticle(decodeURIComponent(url));
    res.json(article);
  } catch (err) {
    const status = (err.code === 'PAYWALL' || err.code === 'BLOCKED') ? 402 : 422;
    res.status(status).json({ error: err.message, code: err.code || null });
  }
});

router.post('/refresh', auth, (req, res) => {
  res.json({ message: 'Refresh started' });
  refreshAllFeeds().catch(console.error);
});

module.exports = router;
