/** User class for message.ly */

const db = require("../db");
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const res = require("express/lib/response");
const ExpressError = require("../expressError");


/** User of the site. */

class User {

  /** register new user 
   *  -- requires
   *    {username, password, first_name, last_name, phone}
   *  -- returns
   *    {id, username, first_name, last_name, phone} */
  static async register({username, password, first_name, last_name, phone}) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, 
          phone, join_at)
        VALUES($1, $2, $3, $4, $5, current_timestamp)
        RETURNING username, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return results.rows[0];
  }


  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) { 
    // Look up user in the database
    const results = await db.query(
      `SELECT username, password
        FROM users
        WHERE username = $1`,
      [username]
    );
    const user = results.rows[0];

    if (user) {
      // If user exists, check to see if password is valid
      return await bcrypt.compare(password, user.password);
    } else {
      // If user does not exist, throw error
      throw new ExpressError('Username/password is incorrect', 400);
    } 
  }


  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    const results = await db.query(
      `UPDATE users 
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username, last_login_at`,
      [username]
    );
    return results.rows[0];
  }


  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone
        FROM users`
    );
    return results.rows;
  }


  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  static async get(username) {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone,
              join_at, last_login_at
        FROM users
        WHERE username = $1`,
      [username]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`User "${username}" does not exist`, 400)
    }
    return results.rows[0];
  }


  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}  */
  static async messagesFrom(username) {

    // Get list of messages sent from user
    const messageResults = await db.query(
      `SELECT id, to_username, body, sent_at, read_at
        FROM messages
        WHERE from_username = $1`,
      [username]
    );

    // From list of messages, create promises for the 
    // user each message was sent to
    const userPromises = messageResults.rows.map(row => {
      const results = db.query(
        `SELECT username, first_name, last_name, phone
          FROM users
          WHERE username = $1`, 
        [row.to_username]
      );
      return results;
    });

    // Get results from all of the prmises
    const resultsArray = await Promise.all(userPromises);
    const users = resultsArray.map(result => result.rows[0]);

    // Match the users to the messages
    return messageResults.rows.map((message, i) => {
      let newMessage = { ...message };
      delete newMessage.to_username;
      newMessage.to_user = users[i];
      return newMessage;
    });
  }

  
  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}   */
  static async messagesTo(username) {

    // Get list of messages sent to user
    const messageResults = await db.query(
      `SELECT id, from_username, body, sent_at, read_at
        FROM messages
        WHERE to_username = $1`,
      [username]
    );

    // From list of messages, create promises for the 
    // user each message was sent from
    const userPromises = messageResults.rows.map(row => {
      const results = db.query(
        `SELECT username, first_name, last_name, phone
          FROM users
          WHERE username = $1`, 
        [row.from_username]
      );
      return results;
    });

    // Get results from all of the prmises
    const resultsArray = await Promise.all(userPromises);
    const users = resultsArray.map(result => result.rows[0]);

    // Match the users to the messages
    return messageResults.rows.map((message, i) => {
      let newMessage = { ...message };
      delete newMessage.from_username;
      newMessage.from_user = users[i];
      return newMessage;
    });    
  }
}


module.exports = User;