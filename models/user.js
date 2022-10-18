/** User class for message.ly */

const db = require("../db")
const ExpressError = require("../expressError")
const bcrypt = require("bcrypt")
const {BCRYPT_WORK_FACTOR} = require("../config")
const res = require("express/lib/response")

/** User of the site. */

class User {

  // constructor({username, password, first_name, last_name, phone}){
  //   this.username = username,
  //   this.password = password,
  //   this.first_name = first_name,
  //   this.last_name = last_name,
  //   this.phone = phone
  // }


    /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  // method being called on the class itself- not instance of class.
  static async register({username, password, first_name, last_name, phone}) { 

    // passing in the password to hash with the work factor (rounds of hashing)
    let hashed_password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)

    const result = await db.query(
      `INSERT INTO users (
            username,
            password,
            first_name,
            last_name, 
            phone,
            join_at,
            last_login_at )
          VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
          RETURNING username, password, first_name, last_name, phone`,
      [username, hashed_password, first_name, last_name, phone]);

    return result.rows[0];

    }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {

    let result = await db.query(`
    SELECT password 
    FROM users
    WHERE username = $1`, [username]);

    let user = result.rows[0];

    // if a valid user exists
      // compare given password (method auto hashes the given password)against the db user pw. Evaluation either true or false
    return user && await bcrypt.compare(password, user.password);

  }

  /** Update last_login_at for user */
  // if you update something that does not exist SQL does not throw an error so check the response length.

  static async updateLoginTimestamp(username) { 

    let updated_user = await db.query(`
      UPDATE users 
      SET last_login_at = current_timestamp
      WHERE username = $1 
      RETURNING username`, 
      [username])

      if (updated_user.rows.length === 0){
        return new ExpressError("User does not exist", 404)
      } 
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 

    let users = await db.query(
    `SELECT username, first_name, last_name, phone
    FROM users
    ORDER BY username
    `); 
    
    // you want to keep ALL so rows.
    return users.rows
}


  // Get: get user by username
  static async get(username) { 

    let user = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1 
      `, 
      [username]
    );

    let user_info = user.rows[0]

    if (!user_info){
      return new ExpressError("Invalid user", 404)
    } else {
      return user_info
    }

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  // we are joining on "to_username" bc we are querying all the users messages FROM given user and returning the users/messages they're sent messages TO. Look at WHERE 

  static async messagesFrom(username) {

    const messagesFromUser = await db.query(
      `SELECT m.id,
              m.to_username,
              u.first_name,
              u.last_name,
              u.phone,
              m.body,
              m.sent_at,
              m.read_at
        FROM messages AS m
          JOIN users AS u ON m.to_username = u.username
        WHERE from_username = $1`,
      [username]);

    // we get an array of messages so we are nicely formatting w/ key info for easy user readability. Map == looping thru the array & using the response properties to extraxt values.

    return messagesFromUser.rows.map(msg => ({
      id : msg.id,
      to_user : {
        username: msg.to_username,
        first_name : msg.first_name,
        last_name : msg.last_name,
        phone : msg.phone
      },
      body : msg.body,
      sent_at : msg.sent_at,
      read_at: msg.read_at
    }));

  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

   // we are joining on "from_username" bc we are wuerying the messages being sent TO the given user FROM other users

  static async messagesTo(username) { 

    const messagesToUser = await db.query(
      `SELECT m.id,
              m.from_username,
              u.first_name,
              u.last_name,
              u.phone,
              m.body,
              m.sent_at,
              m.read_at
        FROM messages AS m
        JOIN users AS u ON m.from_username = u.username
        WHERE to_username = $1`,
      [username]);

  
      // we get an array of messages so we are nicely formatting w/ key info for easy user readability. Map == looping thru the array & using the response properties to extraxt values.
  
      return messagesToUser.rows.map(msg => ({
        id : msg.id,
        from_user : {
          username: msg.from_username,
          first_name : msg.first_name,
          last_name : msg.last_name,
          phone : msg.phone
        },
        body : msg.body,
        sent_at : msg.sent_at,
        read_at: msg.read_at
      }))
  }
}


module.exports = User;