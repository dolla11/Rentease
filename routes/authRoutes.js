const express = require('express');
const auth = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.post('/logout', requireAuth, auth.logout);
router.get('/me', requireAuth, auth.me);

module.exports = router;
