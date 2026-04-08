const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const getGateways = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payment_gateways ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching gateways:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const updateGateway = async (req, res) => {
  const { slug } = req.params;
  const { 
    api_key_public, 
    api_key_secret, 
    merchant_id, 
    environment, 
    webhook_secret,
    webhook_url,
    is_active 
  } = req.body;

  try {
    // If activating this gateway, deactivate all others first
    if (is_active === true || is_active === 1) {
      await db.query('UPDATE payment_gateways SET is_active = 0');
    }

    const [result] = await db.query(
      'UPDATE payment_gateways SET api_key_public = ?, api_key_secret = ?, merchant_id = ?, environment = ?, webhook_secret = ?, webhook_url = ?, is_active = ? WHERE slug = ?',
      [api_key_public, api_key_secret, merchant_id, environment, webhook_secret, webhook_url, (is_active === true || is_active === 1) ? 1 : 0, slug]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Gateway not found' });
    }

    res.json({ success: true, message: 'Gateway updated successfully' });
  } catch (error) {
    console.error('Error updating gateway:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  getGateways,
  updateGateway
};
