
const Router = require("express").Router;
const router = new Router();
const Message = require("../models/message");
const ExpressError= require("../expressError");
const {ensureLoggedIn} = require("../middleware/auth");
const { user } = require("pg/lib/defaults");
const { messagesTo } = require("../models/user");

// are all prefixed with /messages and already uses authenticateJWS middleware

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

router.get("/:id", 
  ensureLoggedIn,  
  async function (req, res, next) {
  try {
    // req.user.username attributed when middleware autheniticateJWS is run.
    let username = req.user.username;
    let msg = await Message.get(req.params.id);

    if (msg.to_user.username !== username && msg.from_user.username !== username) {
      throw new ExpressError("Cannot read this message", 401);
    }

    return res.json({message: msg});
  }

  catch (err) {
    return next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/",
  ensureLoggedIn,
  async function (req, res, next){
    try {
      // let from_username = req.user.username;

      // the model class destructures the msg body & to_username

      let new_message = await Message.create(req.body);

      return res.json({"message" : new_message});
      } catch (e) {
      return next(e);
    }
  })


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

// passing in the message id
router.post("/:id/read",
  ensureLoggedIn,
  async function (req, res, next) {
    try {

      // req.user.username assigned as part of payload when authenticating JWT.
      let username = req.user;

      console.log(username);
      // first ensure message exists
      let message = await Message.get(req.params.id);
      console.log(message);

    // confirm the message was sent to the user trying to mark it as read.
      
    if (message.to_user.username !== username) {
      throw new ExpressError("Unath access, unable to mark msg as read.", 401);
    } else {

      let readMessage = await Message.markRead(req.params.id);
      return res.json({"Updated msg": message});
    }
    } catch(e) {
      next(e);
    }
  } )

module.exports = router;