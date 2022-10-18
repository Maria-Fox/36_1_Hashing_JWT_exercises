const Router = require("express").Router;
const router = new Router();
const User = require("../models/user");
const {authenticateJWT, ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth")

//  all routes prexide with users/ and use authenticateJWT

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get("/all", 
  authenticateJWT, 
  ensureLoggedIn, 
  async function (req, res, next){
    try {
      let all_users = await User.all();
      return res.json({all_users});
    } catch(e) {
      next(e);
    }
  })

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get("/:username",
  ensureLoggedIn, 
  async function (req, res, next){
    try {
      let username = req.params.username;
      let chosenUserInfo = await User.get(username);
      return res.json({"user" : chosenUserInfo})
    } catch(e){
      return next(e);
    }
  })


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

// only signed in user may see their own messages.

router.get("/:username/to", 
  ensureCorrectUser,
  async function (req, res, next){
    try{
      // ensure valid user first. If not it wil lthrow an error.
      let valid_user = User.get(req.params.username);
      let messagesToUser = await User.messagesTo(req.params.username);

      return res.json({"messages" : messagesToUser}); 
    } catch (e) {
      next(e);
    };
  });


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

// only signed in user may see their own messages.


router.get("/:username/from",
ensureCorrectUser,
  async function (req, res, next){
  try{
    let messagesFromUser = await User.messagesFrom(req.params.username);

    return res.json({"messages" : messagesFromUser}); 
  } catch (e) {
    next(e);
  };
});



module.exports = router; 