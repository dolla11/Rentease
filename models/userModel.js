const db = require('../config/db');

async function findByEmail(email) {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
}

async function findById(id) {
  const [rows] = await db.query(
    'SELECT id, full_name, email, phone, role, status, theme, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}

async function create({ fullName, email, phone, passwordHash, role }) {
  const [result] = await db.query(
    'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [fullName, email, phone || null, passwordHash, role]
  );
  return result.insertId;
}

module.exports = { findByEmail, findById, create };