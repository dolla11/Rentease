const db = require('../config/db');

// Writes a line to the security log (logins, failed logins, etc.)
async function add(userId, eventType, ip, details) {
  await db.query(
    'INSERT INTO security_logs (user_id, event_type, ip_address, details) VALUES (?, ?, ?, ?)',
    [userId || null, eventType, ip, details || null]
  );
}

module.exports = { add };