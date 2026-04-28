const router = require('express').Router();
const auth = require('../middleware/auth');
const FeedItem = require('../models/FeedItem');
const Source = require('../models/Source');
const KeywordRule = require('../models/KeywordRule');

router.get('/stats', auth, async (req, res) => {
  const [totalItems, unreadItems, hiddenItems, alertItems, totalSources, activeSources] =
    await Promise.all([
      FeedItem.countDocuments({ hidden: false }),
      FeedItem.countDocuments({ read: false, hidden: false }),
      FeedItem.countDocuments({ hidden: true }),
      FeedItem.countDocuments({ type: 'alert', hidden: false }),
      Source.countDocuments(),
      Source.countDocuments({ active: true }),
    ]);
  res.json({ totalItems, unreadItems, hiddenItems, alertItems, totalSources, activeSources });
});

router.delete('/feed/clear-read', auth, async (req, res) => {
  const result = await FeedItem.deleteMany({ read: true });
  res.json({ deleted: result.deletedCount });
});

router.delete('/feed/clear-all', auth, async (req, res) => {
  const result = await FeedItem.deleteMany({ type: { $ne: 'alert' } });
  res.json({ deleted: result.deletedCount });
});

module.exports = router;
