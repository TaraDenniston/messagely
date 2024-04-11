const express = require('express');
const User = require('../models/user');
const router = new express.Router();
const ExpressError = require('../expressError');


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
  try{
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ExpressError('Username and password required', 400);
    }
    if (await User.authenticate(username, password)) {
      return res.json('Login successful');
    } else {
      throw new ExpressError('Pssword is incorrect', 400);
    }
  } catch (e) {
    return next(e);
  }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
  try {
    console.log('Inside /register route')
    // Register user
    const user = await User.register(req.body);
    console.log('/register - user:')
    console.log(user);
    // Update last login
    const timeStamp = await User.updateLoginTimestamp(user.username);
    console.log('/register - timeStamp:')
    console.log(timeStamp);
    // Create token (to be implemented)
    // Return token (to be implemented)
    return res.json('User Registered');
  } catch (e) {
    if (e.code === '23505') {
      return next(new ExpressError('Username already exists', 400));
    }
    return next(e);
  }
});


module.exports = router;