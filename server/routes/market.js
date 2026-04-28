const router = require('express').Router();
const auth = require('../middleware/auth');
const { fetchMarketData } = require('../services/marketService');

router.get('/', auth, async (req, res) => {
  try {
    const data = await fetchMarketData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
