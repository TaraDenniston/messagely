const express = require('express');
const router = new express.Router();
const Message = require('../models/message');
const ExpressError = require('../expressError');
const { ensureLoggedIn } = require('../middleware/auth');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
  try {
    const id = req.params.id;
    const message = await Message.get(id);

    // Throw error if the logged-in user is not either the sender or recipient
    if(!(message.from_user.username === req.user.username || 
         message.to_user.username === req.user.username)) {
      throw new ExpressError(`User is unauthorized to access message ${id}`, 401);
    }

    return res.json({ message: message });

  } catch (e) {
    return next(e);
  }  
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async (req, res, next) => {
  try {
    const from_username = req.user.username;
    const { to_username, body } = req.body;
    const message = await Message.create({from_username, to_username, body});
    
    return res.json({ message: message });

  } catch (e) {
    return next(e);
  }  
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', async (req, res, next) => {
  try {
    const id = req.params.id;
    const message = await Message.get(id);

    if (message.to_user.username !== req.user.username) {
      throw new ExpressError(`User is unauthorized to access message ${id}`, 401);
    }

    const readMessage = await Message.markRead(id);

    return res.json({ message: readMessage });

  } catch (e) {
    return next(e);
  }
});


module.exports = router;

