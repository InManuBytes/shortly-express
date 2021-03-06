const models = require('../models');
const Promise = require('bluebird');

// In middleware/auth.js, write a createSession middleware function that accesses the parsed cookies on the request, looks up the user data related to that session, and assigns an object to a session property on the request that contains relevant user information. (Ask yourself: what information about the user would you want to keep in this session object?) --
// Things to keep in mind:
// An incoming request with no cookies should generate a session with a unique hash and store it in the sessions database. The middleware function should use this unique hash to set a cookie in the response headers. (Ask yourself: How do I set cookies using Express?).
// If an incoming request has a cookie, the middleware should verify that the cookie is valid (i.e., it is a session that is stored in your database).
// If an incoming cookie is not valid, what do you think you should do with that session and cookie?



module.exports.createSession = (req, res, next) => {
  // var username = req.body.username;
  // TRYING to link Users table with Session here was the wrong route
  // check for cookies
  if (Object.keys(req.cookies).length === 0) {
    console.log("DIDN\'T FIND COOKIES, CREATING A NEW SESSION");
    // if there are no cookies on the request make a new session
    return module.exports._createNewSessionSetCookies(req, res, next);
  } else {
    console.log('FOUND COOKIES', req.cookies);// {shortlyid: 'hash'}
    return models.Sessions.get({hash: req.cookies.shortlyid})
      .then((record) => {
        console.log('VALIDATING COOKIES');
        if (record === undefined) {
          console.log('INVALID COOKIE:',req.cookies,'CLEARING COOKIES AND CREATING NEW SESSION');
          res.clearCookie('shortlyid');
          return module.exports._createNewSessionSetCookies(req, res, next);
        } else {
          console.log('COOKIES VALID, ASSIGNING SESSION TO:', record);
          req.session = {'hash': record.hash};
          req.session.userId = record.userId;
          if (record.user) {
            req.session.user = {};
            console.log('SESSION:', req.session);
            req.session.user['username'] = record.user.username;
          }
        }
        next();
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/
module.exports.verifySession = (req, res, next) => {
  //Require users to log in to see shortened links and create new ones.
  // Do NOT require the user to login when using a previously shortened link.
  if (req.path === '/:code' || models.Sessions.isLoggedIn(req.session)) {
    next();
  } else {
    res.redirect('/login');
    next();
  }
};

// we called in a bit of code twice, so we can make a private function to handle
// creating a new session record and setting cookies on the response
module.exports._createNewSessionSetCookies = (req, res, next) => {
  return models.Sessions.create() // creates a random string with hash then calls super Create (model)
    .then((results) => {
      var id = results.insertId;
      console.log("SESSION CREATED AT sessionId", id);
      return models.Sessions.get({id: id});
    })
    .then((record) => {
      console.log("SESSION RECORD", record);
      req.session = {'hash': record.hash};
      return record.hash;
    })
    .then((hash) => {
      console.log('SETTTING COOKIES HASH:', hash);
      res.cookie('shortlyid', hash);
      next();
    });
};