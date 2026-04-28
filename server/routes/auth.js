const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id, username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    res.json({ token, username });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// One-time setup endpoint to create the admin account
router.post('/setup', async (req, res) => {
  const { username, password, setupKey } = req.body;
  if (setupKey !== (process.env.SETUP_KEY || 'setup123')) {
    return res.status(403).json({ error: 'Invalid setup key' });
  }
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'User already exists' });
    const user = await User.create({ username, password });
    res.json({ message: 'Account created', username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
