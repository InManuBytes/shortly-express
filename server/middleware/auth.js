const models = require('../models');
const Promise = require('bluebird');
const parseCookies = require('./cookieParser.js');

// In middleware/auth.js, write a createSession middleware function that accesses the parsed cookies on the request, looks up the user data related to that session, and assigns an object to a session property on the request that contains relevant user information. (Ask yourself: what information about the user would you want to keep in this session object?) -- Stuff related to links?
// Things to keep in mind:
// An incoming request with no cookies should generate a session with a unique hash and store it in the sessions database. The middleware function should use this unique hash to set a cookie in the response headers. (Ask yourself: How do I set cookies using Express?).
// If an incoming request has a cookie, the middleware should verify that the cookie is valid (i.e., it is a session that is stored in your database).
// If an incoming cookie is not valid, what do you think you should do with that session and cookie?



module.exports.createSession = (req, res, next) => {
  // check for cookies
  console.log("REQUEST", req, "COOKIES",req.headers);
  if (req.headers.cookie === undefined) {
    // if there are no cookies on the request
    // make a new session
    return models.Sessions.create()
      .then((results) => {
        console.log("RESULT OF SESSIONS.CREATE", results.insertId);
        var id = results.insertId;
        return models.Sessions.get({id: id});
      })
      .then((record) => {
        console.log("RECORD", record);
        req.session = {'hash': record.hash}
        next();
      })
    // set a cookie in the response headers: session.hash req session: {hash}
    // req.session = {'hash': "this should be the session hash"};
    res.cookie('session', 'hash');
    //console.log(res);
  }
  // if there are cookies
  // verify the cookie is valid
  // get the value
  // use that value to access data
  // assigns an object to a session property on the request that contains relevant user information
  next();
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

