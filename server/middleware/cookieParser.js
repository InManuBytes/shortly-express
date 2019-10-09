// write a middleware function that will access the cookies on an incoming request,
// parse them into an object, {shortlyid: 'cookie'}
// and assign this object to a cookies property on the request.

// req
// {
//    headers: {
//      Cookie: 'shortlyid=8a864482005bcc8b968f2b18f8f7ea490e577b20'
//    }
// }
const _ = require('lodash');

const parseCookies = (req, res, next) => {
  console.log("REQUEST",req);
  let cookies = (req === undefined) ? req.headers.cookie : {};
  // let cookieArray = (cookie) ? cookie.split(";") : [];
  // let cookieObject = {};
  // (cookie) ? cookieObject[cookieArray[0]] = cookieArray[1] : cookieObject = {};
  let parsedCookies = _.reduce(cookies, (acc, cookie) => {
    cookie = cookie.split("=");
    return acc[cookie[0]] = cookie[1];
  }, {})
  console.log("PARSED COOKIES", parsedCookies);
  //assign this object to a cookies property on the request
  req.cookies = parseCookies();
  next();
};

module.exports = parseCookies;