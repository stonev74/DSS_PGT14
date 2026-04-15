//login route
const express = require('express');
const router = express.Router();
const path = require('path');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs:       15 * 60 * 1000,
    max:            10,
    message:        'Too many login attempts. Please try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders:  false
});

module.exports = (db) => {
  const htmlRoot = path.join(__dirname, '..', 'public', 'html');

  router.post('/click', (req, res) => {
    const { x, y, n } = req.body;
    // console.log('Received:', x, y, n);
    // console.log(' n is a ', typeof n);
    let user_n = n;

    res.json({ redirect: '/login' });

    // console.log('Received3:', x, y, n);
  });

  router.get('/login', (req, res) => {
    res.sendFile('login.html', { root: htmlRoot });
  });

  // Login POST request
  router.post('/password', loginLimiter, async (req, res) => {
    const username = req.body.username_input;
    const password = req.body.password_input;
    const ip_addr = req.socket.remoteAddress?.replace('::ffff:', '');
    try {
      const login_check = await db.one(
        'SELECT check_user_login2($1, $2, $3, $4, $5) AS check',
        [username, password, 'localhost', ip_addr, user_n]
      );
      //check failed login first
      if (login_check.check !== 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid login information'
        });
      }
      //check user role
      const subs = await db.one(
        'SELECT role FROM user_vw WHERE username = $1',
        [username]
      );
      // Regenerate session after login
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regen failed:', err);
          return res.status(500).send('Login error');
        }
        //adds authentication to session and user details
        req.session.authenticated = true;
        req.session.user = {
          username: username,
          role: subs.role
        };
        //page redirect in regenerate so can't redirect without regen session
        if (subs.role === 'CONTRIBUTOR') {
          return res.json({ success: true, redirectTo: '/index.html' });
        }
        return res.json({ success: true, redirectTo: '/index_subs.html' });
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        success: false,
        error: 'Server error, please try again'
      });
    }
  });

  return router;
};
