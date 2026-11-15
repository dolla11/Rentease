require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/api/hello', (req, res) => {
  res.json({ success: true, message: 'RentEase API is running' });
});

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

// Routes
app.use('/api/auth', authRoutes);

// Catches any unexpected error so the server does not crash
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong' } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));