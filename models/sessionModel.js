const db = require('../config/db');

async function create(id, userId, ip, expiresAt) {
  await db.query(
    'INSERT INTO sessions (id, user_id, ip_address, expires_at) VALUES (?, ?, ?, ?)',
    [id, userId, ip, expiresAt]
  );
}

// Only returns the session if it has not expired
async function findValid(id) {
  const [rows] = await db.query(
    'SELECT * FROM sessions WHERE id = ? AND expires_at > NOW()',
    [id]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM sessions WHERE id = ?', [id]);
}

module.exports = { create, findValid, remove };