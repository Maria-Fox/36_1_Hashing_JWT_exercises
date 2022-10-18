const express = require("express");
const router = new express.Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { ExpressError } = require("../expressError");

// all routes prefixed w/ "auth/ as seen on app.js"


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async function (req, res, next) {
  try {
    let {username, password} = req.body;
    if (await User.authenticate(username, password)) {
      let token = jwt.sign({username}, SECRET_KEY);
      User.updateLoginTimestamp(username);
      return res.json({token});
    } else {
      return new ExpressError("Invalid username/password", 400);
    }
  }

  catch (err) {
    return next(err);
  }
});

// when entering an invalid user I get this message:"message": "ExpressError is not a constructor"
router.post("/login", async function (req, res, next) {
  try {

    let {username, password} = req.body;

    // is auth resolves to true, it returns user and the token
    if (await User.authenticate(username, password)) {
      let updated_login = User.updateLoginTimestamp(username);

      let user_token = jwt.sign({username}, SECRET_KEY);
      return res.json({user_token});
    // }
    } else {
      // is auth resolves to false in models it will return this error
      throw new ExpressError("Invalid username/password", 400);
    }
  }

  catch (e) {
    return next(e);
  }
});

router.get("/", async function (req,res, next){
  try{
    return res.json("this worked")
  } catch (e) {
    return ExpressError ("Got error instead", 400)
  }
})


/** POST /register - register user: registers, logs in, and returns token*/

router.post("/register", async function (req, res, next){
  try {

    // let {username, password, first_name, last_name, phone } = req.body;

    // if (!username || !password || first_name || last_name|| phone){
    //   return res.json(ExpressError("Please complete all fields to create an acct."))
    // }

    // the register route in the models class already decontructs the body info. I would prefer to deconstruct & test if all items are here prior to sending db request, but, oh well.
    let new_user = await User.register(req.body);

    // JSON Web token signs payload w/ valid server signature to encode the token
    let user_token = jwt.sign(new_user.password, SECRET_KEY);
    let updated_login = User.updateLoginTimestamp(new_user.username);

    return res.json({user_token});

  } catch (e){
    next(e)
  }
})


module.exports = router;