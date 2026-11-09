const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase());
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = db.prepare(`
      INSERT INTO users (name, username, email, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(name.trim(), username.toLowerCase().trim(), email.toLowerCase().trim(), passwordHash);

    const user = db.prepare('SELECT id, name, username, email, avatar, bio, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);

    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful.',
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

exports.getMe = (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const userId = req.user.id;

    db.prepare(`
      UPDATE users SET name = ?, bio = ?, avatar = ?
      WHERE id = ?
    `).run(name || req.user.name, bio || '', avatar || null, userId);

    const updated = db.prepare('SELECT id, name, username, email, avatar, bio, created_at FROM users WHERE id = ?').get(userId);

    res.json({ user: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error changing password.' });
  }
};
