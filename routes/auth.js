const express = require('express');
const jwt = require('jsonwebtoken');
const router = new express.Router();
const User = require('../models/user');
const ExpressError = require('../expressError');
const { SECRET_KEY } = require('../config');


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
  try{
    // Make sure request body has needed data
    const { username, password } = req.body;
    if (!username || !password) {
      throw new ExpressError('Username and password required', 400);
    }

    // If user is authenticated 
    if (await User.authenticate(username, password)) {
      // Update last login
      await User.updateLoginTimestamp(username);

      // Generate and return JSON web token
      const token = jwt.sign({ username }, SECRET_KEY);
      return res.json({ message: 'Login successful', token });

    // Throw error if user is not authenticated
    } else {
      throw new ExpressError('Username/password is incorrect', 400);
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
    // Register user
    const user = await User.register(req.body);

    // Update last login
    await User.updateLoginTimestamp(user.username);

    // Generate and return JSON web token
    const token = jwt.sign({ username: user.username }, SECRET_KEY);
    return res.json({ message: 'User Registered', token });

  } catch (e) {
    if (e.code === '23505') {
      return next(new ExpressError('Username already exists', 400));
    }
    return next(e);
  }
});


module.exports = router;