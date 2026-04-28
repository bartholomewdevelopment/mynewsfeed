const router = require('express').Router();
const auth = require('../middleware/auth');
const { fetchWeatherForZip } = require('../services/weatherService');

router.get('/', auth, async (req, res) => {
  const { zip } = req.query;
  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json({ error: 'Valid 5-digit ZIP required' });
  }
  try {
    const data = await fetchWeatherForZip(zip);
    res.json(data);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

module.exports = router;
