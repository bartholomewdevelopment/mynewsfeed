const router = require('express').Router();
const auth = require('../middleware/auth');
const { fetchScores } = require('../services/sportsScores');

router.get('/scores', auth, async (req, res) => {
  try {
    const scores = await fetchScores();
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
