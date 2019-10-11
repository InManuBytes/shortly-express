const models = require('../models');
const Promise = require('bluebird');

// In middleware/auth.js, write a createSession middleware function that accesses the parsed cookies on the request, looks up the user data related to that session, and assigns an object to a session property on the request that contains relevant user information. (Ask yourself: what information about the user would you want to keep in this session object?) -- Stuff related to links?
// Things to keep in mind:
// An incoming request with no cookies should generate a session with a unique hash and store it in the sessions database. The middleware function should use this unique hash to set a cookie in the response headers. (Ask yourself: How do I set cookies using Express?).
// If an incoming request has a cookie, the middleware should verify that the cookie is valid (i.e., it is a session that is stored in your database).
// If an incoming cookie is not valid, what do you think you should do with that session and cookie?



module.exports.createSession = (req, res, next) => {
  // check for cookies
  if (Object.keys(req.cookies).length === 0) {
    // if there are no cookies on the request
    // make a new session
    return models.Sessions.create()
      .then((results) => {
        console.log("SESSION CREATE RESULTS", results);
        var id = results.insertId;
        return models.Sessions.get({id: id});
      })
      .then((record) => {
        req.session = {'hash': record.hash};
        return record.hash;
      })
      .then((hash) => {
        res.cookie('shortlyid', hash);
        next();
      });
  } else {
    //console.log("GOT COOKIES", req.cookies);// {shortlyid: 'hash'}
    return models.Sessions.get({hash: req.cookies.shortlyid})
      .then((record) => {
        //console.log("RECORD FROM GET", record);
        if (record === undefined) {
          res.clearCookie('shortlyid');
          return models.Sessions.create()
            .then((results) => {
              var id = results.insertId;
              return models.Sessions.get({id: id});
            })
            .then((record) => {
              res.cookie('shortlyid', record.hash);
              next();
            });
        } else {
          req.session = {'hash': record.hash};
          return record;
        }
      })
      .then((record) => {
        req.session.userId = record.userId;
        if (record.user) {
          req.session.user = {};
          console.log('SESSION:', req.session);
          req.session.user['username'] = record.user.username;
        }
        console.log('ASSIGNED USERNAME', req.session);
        //req.session.user = {username: record.user.username};
        next();
      });
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
module.export.verifySession = (req, res, next) => {
  if (req.path === '/') {
    return next();
  }
  // authenticate user
  // feed isLoggedIn function a session
  // is logged in === false, redirect to login
  // otherwise, continue
  nest();
};