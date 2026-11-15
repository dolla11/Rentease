const Session = require('../models/sessionModel');
const User = require('../models/userModel');

// Blocks the request unless the user has a valid login cookie
async function requireAuth(req, res, next) {
  try {
    const sid = req.cookies.sid;
    if (!sid) {
      return res.status(401).json({ success: false, error: { code: 'NOT_LOGGED_IN', message: 'Please log in' } });
    }

    const session = await Session.findValid(sid);
    if (!session) {
      res.clearCookie('sid');
      return res.status(401).json({ success: false, error: { code: 'SESSION_EXPIRED', message: 'Session expired, please log in again' } });
    }

    const user = await User.findById(session.user_id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, error: { code: 'NOT_ALLOWED', message: 'Account not active' } });
    }

    req.user = user;
    req.sessionId = sid;
    next();
  } catch (err) {
    next(err);
  }
}

// Only lets certain roles through, e.g. requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission' } });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };