/** User class for message.ly */
const db = require("../db");
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const res = require("express/lib/response");


/** User of the site. */

class User {

  /** register new user 
   *  -- requires
   *    {username, password, first_name, last_name, phone}
   *  -- returns
   *    {id, username, first_name, last_name, phone} */
  static async register({username, password, first_name, last_name, phone}) {
    console.log('Inside User.register()');
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      `INSERT INTO users (
          username, 
          password, 
          first_name, 
          last_name, 
          phone,
          join_at)
        VALUES($1, $2, $3, $4, $5, current_timestamp)
        RETURNING username, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    console.log('User.register - results.rows[0]:')
    console.log(results.rows[0]);
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    console.log('Inside User.updateLoginTimestamp()');
    const results = await db.query(
      `UPDATE users 
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username, last_login_at`,
      [username]
    );
    console.log(results.rows[0]);
    console.log('User.updateLoginTimestamp - results.rows[0]:')
    return results.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;