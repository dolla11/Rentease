require('dotenv').config();
const express = require('express');
const db = require('./config/db');

const app = express();
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ success: true, message: 'RentEase API is running' });
});

// Test route: checks the database connection
app.get('/api/health/db', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema = ?',
      [process.env.DB_NAME]
    );
    res.json({ success: true, data: { tables: rows[0].tables } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'DB_ERROR', message: err.message } });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));