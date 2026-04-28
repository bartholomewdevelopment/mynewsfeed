const router = require('express').Router();
const auth = require('../middleware/auth');
const Source = require('../models/Source');
const { resolveChannelId } = require('../services/youtubeFetcher');

// Resolve a YouTube channel URL → channel ID without saving anything
router.post('/resolve-youtube', auth, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const channelId = await resolveChannelId({ url, channelId: null });
    if (!channelId) {
      return res.status(404).json({ error: 'Could not find a channel ID in that URL. Try pasting the full channel page URL.' });
    }
    res.json({
      channelId,
      rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  const sources = await Source.find().sort({ priority: -1, name: 1 });
  res.json(sources);
});

router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    // Auto-resolve channel ID for new YouTube sources
    if (data.type === 'youtube' && data.url && !data.channelId) {
      const id = await resolveChannelId({ url: data.url, channelId: null }).catch(() => null);
      if (id) data.channelId = id;
    }
    const source = await Source.create(data);
    res.status(201).json(source);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    // Re-resolve if URL changed and channelId not manually set
    if (data.type === 'youtube' && data.url && !data.channelId) {
      const id = await resolveChannelId({ url: data.url, channelId: null }).catch(() => null);
      if (id) data.channelId = id;
    }
    const source = await Source.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!source) return res.status(404).json({ error: 'Source not found' });
    res.json(source);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const source = await Source.findByIdAndDelete(req.params.id);
  if (!source) return res.status(404).json({ error: 'Source not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
