const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT `key`, value, description FROM settings');
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a setting by key
router.get('/:key', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT value FROM settings WHERE `key` = ?', [req.params.key]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json({ key: req.params.key, value: rows[0].value });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update or create a setting (Admin only ideally, but let's keep it simple first)
router.post('/', async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ message: 'Key is required' });

  try {
    await db.execute(
      'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      [key, value, value]
    );
    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
