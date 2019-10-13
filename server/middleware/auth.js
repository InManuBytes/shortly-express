const models = require('../models');
const Promise = require('bluebird');

// In middleware/auth.js, write a createSession middleware function that accesses the parsed cookies on the request, looks up the user data related to that session, and assigns an object to a session property on the request that contains relevant user information. (Ask yourself: what information about the user would you want to keep in this session object?) -- Stuff related to links?
// Things to keep in mind:
// An incoming request with no cookies should generate a session with a unique hash and store it in the sessions database. The middleware function should use this unique hash to set a cookie in the response headers. (Ask yourself: How do I set cookies using Express?).
// If an incoming request has a cookie, the middleware should verify that the cookie is valid (i.e., it is a session that is stored in your database).
// If an incoming cookie is not valid, what do you think you should do with that session and cookie?



module.exports.createSession = (req, res, next) => {
  // var username = req.body.username;
  // TRYING to link Users table with Session here seems to be the wrong route
  // if (req.body.username) {
    //   // if they come in with username -> they are already loggedin?
    //   // their user id, set that in options
    //   // otherwise options
    //   //console.log("USERNAME", req.body.username);
    //   models.Users.get({username}).then((results) => {
      //     console.log("USER FIRST BLOCK", results);
      //   })
      // }
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
          console.log('COOKIES NOT FROM SHORTLY:',req.cookies,'CLEARING COOKIES AND CREATING NEW SESSION');
          res.clearCookie('shortlyid');
          return module.exports._createNewSessionSetCookies(req, res, next);
        } else {
          console.log('COOKIES VALID, ASSIGNING SESSION');
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
<<<<<<< HEAD
module.exports.verifySession = (req, res, next) => {
  if(req.path === '/') {
=======
module.export.verifySession = (req, res, next) => {
  if (req.path === '/') {
>>>>>>> b0c01c4001aee1fc24704f50f7d79347e570eabc
    return next();
  }
  // authenticate user
  // feed isLoggedIn function a session
  // is logged in === false, redirect to login
  // otherwise, continue
  next();
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
      console.log('SETTTING COOKIES');
      res.cookie('shortlyid', hash);
      next();
    });
};