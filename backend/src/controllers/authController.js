const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { name = '', email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email & password required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already used' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ id: user._id, email: user.email, name: user.name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: u._id, email: u.email, name: u.name } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.profile = async (req, res) => {
  const u = await User.findById(req.userId).select('-passwordHash');
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json(u);
};
