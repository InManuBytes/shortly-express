// write a middleware function that will access the cookies on an incoming request,
// parse them into an object, {shortlyid: 'cookie'}
// and assign this object to a cookies property on the request.

// req
// {
//    headers: {
//      Cookie: 'shortlyid=8a864482005bcc8b968f2b18f8f7ea490e577b20'
//    }
// }
//
// MULTIPLE COOOKIES
//
// Cookie: 'shortlyid=18ea4fb6ab3178092ce936c591ddbb90c99c9f66; otherCookie=2a990382005bcc8b968f2b18f8f7ea490e990e78; anotherCookie=8a864482005bcc8b968f2b18f8f7ea490e577b20'
//
const _ = require('lodash');

const parseCookies = (req, res, next) => {
  console.log("REQUEST",req);
  // since the cookies are stored as a string split up by semicolons
  // you'd first want to split the individual cookiessee line 14
  let cookies = (req === undefined || req.headers.cookie === undefined) ? {} : req.headers.cookie.split("; ");
  // let cookieArray = (cookie) ? cookie.split(";") : [];
  // let cookieObject = {};
  // (cookie) ? cookieObject[cookieArray[0]] = cookieArray[1] : cookieObject = {};
  var parsedCookies = _.reduce(cookies, (acc, cookie) => {
      console.log(cookie);
      cookie = cookie.split("=");
      acc[cookie[0]] = cookie[1]
      return acc;
    }, {})
  console.log("PARSED COOKIES", parsedCookies);
  //assign this object to a cookies property on the request
  req.cookies = parsedCookies;
  next();
};

module.exports = parseCookies;