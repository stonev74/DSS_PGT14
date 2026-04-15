//register routes
const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const pepper = 'yshlxehpyoxi';

module.exports = (db) => {
  const registerHtmlRoot = path.join(__dirname, '..', 'public', 'html');

  //Register GET route -Vin
  router.get('/', async (req, res) => {
    //send static file
    res.sendFile('register.html', { root: registerHtmlRoot }, (err) => {
      if (err) {
        console.log(err)
      }
    })
  })

  //Register POST route -Vin
  //need to check if password is weak or in pwnedpasswords
  router.post('/', async (req, res) => {
    const username = req.body.username_input;
    const password = req.body.password_input;
    try {
      //need to account for if account info empty
      //bcrypt generates unique salt for user password and hashes it with password+pepper
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password + pepper, salt);
      const role = 'SUBSCRIBER'
      //need to change insert query to enrole user, need to add column for salt in database
      const result = await db.oneOrNone('SELECT enrole_user ($1, $2, $3);', [username, hashedPassword, role]);
      res.send('An email has been sent to activate your account');
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  return router;
};