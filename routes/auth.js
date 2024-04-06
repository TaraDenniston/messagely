const express = require('express');
const User = require('../models/user');
const router = new express.Router();


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
  try {
    console.log('Inside /register route')
    const user = await User.register(req.body);
    console.log('/register - user:')
    console.log(user);
    const timeStamp = await User.updateLoginTimestamp(user.username);
    console.log('/register - timeStamp:')
    console.log(timeStamp);
    return res.json('User Registered');
  } catch (e) {
    return next(e);
  }
})


module.exports = router;