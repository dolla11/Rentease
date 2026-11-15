const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/userModel');
const Session = require('../models/sessionModel');
const Log = require('../models/logModel');

const TWO_HOURS = 2 * 60 * 60 * 1000;

// Secure cookie settings (required by the brief)
const cookieOptions = {
  httpOnly: true,                                  // JavaScript in the browser cannot read it
  sameSite: 'strict',                              // stops CSRF attacks
  secure: process.env.NODE_ENV === 'production',   // only sent over HTTPS when live
  maxAge: TWO_HOURS                                // expires after 2 hours
};

function fail(res, status, code, message, fields) {
  return res.status(status).json({ success: false, error: { code, message, fields } });
}

async function signup(req, res, next) {
  try {
    const { fullName, email, phone, password, role } = req.body;
    const fields = {};

    if (!fullName || fullName.trim().length < 2) fields.fullName = 'Name is required';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fields.email = 'Valid email is required';
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      fields.password = 'Password needs 8+ characters with a letter and a number';
    }
    if (!['tenant', 'landlord'].includes(role)) fields.role = 'Role must be tenant or landlord';

    if (Object.keys(fields).length > 0) {
      return fail(res, 400, 'VALIDATION_ERROR', 'Some fields are invalid', fields);
    }

    const existing = await User.findByEmail(email.toLowerCase());
    if (existing) {
      return fail(res, 409, 'EMAIL_TAKEN', 'Email is already used', { email: 'Email is already used' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = await User.create({ fullName: fullName.trim(), email: email.toLowerCase(), phone, passwordHash, role });
    await Log.add(id, 'SIGNUP', req.ip);

    res.status(201).json({ success: true, data: { id, fullName: fullName.trim(), email: email.toLowerCase(), role } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return fail(res, 400, 'VALIDATION_ERROR', 'Email and password are required');
    }

    const user = await User.findByEmail(email.toLowerCase());
    const passwordOk = user && (await bcrypt.compare(password, user.password_hash));

    if (!passwordOk) {
      await Log.add(user ? user.id : null, 'LOGIN_FAILED', req.ip, `email: ${email}`);
      return fail(res, 401, 'BAD_LOGIN', 'Wrong email or password');
    }
    if (user.status !== 'active') {
      return fail(res, 403, 'SUSPENDED', 'This account is suspended');
    }

    const sid = crypto.randomBytes(32).toString('hex');
    await Session.create(sid, user.id, req.ip, new Date(Date.now() + TWO_HOURS));
    await Log.add(user.id, 'LOGIN', req.ip);

    res.cookie('sid', sid, cookieOptions);
    res.json({ success: true, data: { id: user.id, fullName: user.full_name, role: user.role } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await Session.remove(req.sessionId);
    await Log.add(req.user.id, 'LOGOUT', req.ip);
    res.clearCookie('sid', { httpOnly: true, sameSite: 'strict', secure: cookieOptions.secure });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  res.json({ success: true, data: req.user });
}

module.exports = { signup, login, logout, me };