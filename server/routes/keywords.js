const router = require('express').Router();
const auth = require('../middleware/auth');
const KeywordRule = require('../models/KeywordRule');

router.get('/', auth, async (req, res) => {
  const keywords = await KeywordRule.find().sort({ type: 1, keyword: 1 });
  res.json(keywords);
});

router.post('/', auth, async (req, res) => {
  try {
    const rule = await KeywordRule.create(req.body);
    res.status(201).json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const rule = await KeywordRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const rule = await KeywordRule.findByIdAndDelete(req.params.id);
  if (!rule) return res.status(404).json({ error: 'Rule not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
