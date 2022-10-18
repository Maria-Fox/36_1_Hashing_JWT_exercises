/** Middleware for handling req authorization for routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** Middleware: Authenticate user. */

function authenticateJWT(req, res, next) {
  try {
    // the token is being sent back in the response when a use signs up OR logs in. Then, when any follow up request is sent we extract that token from "_token"
    const tokenFromBody = req.body._token;

    // we ensure it's a valid token issued frm our server w/ our key
    const payload = jwt.verify(tokenFromBody, SECRET_KEY);
    // add token to request propoerty under user
    req.user = payload; // create a current user

    // move onto the next matching route
    return next();
  } catch (err) {
    // does not return the error and stop here. It sends the next matching route. Likely the general error handler.
    return next();
  }
}

/** Middleware: Requires user is authenticated. */

function ensureLoggedIn(req, res, next) {
  // check for propoerty added when we run the authenticateJWT middleware.
  if (!req.user) {
    return next({ status: 401, message: "Unauthorized- not logged in." });
  } else {
    return next();
  }
}

/** Middleware: Requires correct username. */

function ensureCorrectUser(req, res, next) {
  try {
    // the username will be sent in the param for route. If the token username matches the param username then go onto next matching route. Otherwise, send error in next().
    if (req.user.username === req.params.username) {
      return next();
    } else {
      return next({ status: 401, message: "Unauthorized" });
    }
  } catch (err) {
    // errors would happen here if we made a request and req.user is undefined
    return next({ status: 401, message: "Please sign in." });
  }
}
// end

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser
};
