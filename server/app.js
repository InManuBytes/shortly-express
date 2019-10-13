const express = require("express");
const path = require("path");
const utils = require("./lib/hashUtils"); // unique to this app
const partials = require("express-partials");
const bodyParser = require("body-parser");
const Auth = require("./middleware/auth.js");
const cookieParser = require("./middleware/cookieParser.js");
const models = require("./models"); //unique to this app

const app = express();

app.set("views", `${__dirname}/views`);
app.set("view engine", "ejs");
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(cookieParser);
app.use(Auth.createSession);

// all routes here
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/create", (req, res) => {
  res.render("index");
});

app.get("/links", (req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post("/links", (req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

// THINGS TO CONSIDER FROM LEARN
// your database model methods should not receive as arguments or otherwise have access to
// the request or response objects
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/login", (req, res, next) => {
  let username = req.body.username;
  let attempted = req.body.password;
  // determine if they actually are a user in the database
  return models.Users.get({ username })
    .then(user => {
      console.log("LOGGING IN - LOOKING UP USER, FOUND:", user);
      if (!user) {
        console.log("DID NOT FIND USER:", username);
        // if they don't exist we need to send them to the signup page?
        // but the tests are written such that the user is redirected to login page
        // we're going to go into the next .then so we can send a value to test for
        return null;
      } else {
        console.log("FOUND USER, CHECKING PASSWORD");
        return models.Users.compare(attempted, user.password, user.salt);
      }
    })
    .then(rightPassword => {
      // if the password came in null it's because the username wasn't found
      if (!rightPassword) {
        console.log("USER DOESN\'T EXIST OR WRONG PASSWORD");
        res.redirect("/login");
      } else {
        // if they are correct update the session?
        // redirect to the homepage
        console.log("RIGHT PASSWORD");
        res.redirect("/");
      }
      next();
    })
    .catch(err => {
      throw err;
    });
});

app.post("/signup", (req, res, next) => {
  //console.log("REQ.BODY",req.body); // { username: 'Samantha', password: 'Samantha' }
  let username = req.body.username;
  // check if the user is already in the database
  return models.Users.get({ username }) // get(options) → {Promise.<Object>}
    .then(user => {
      console.log("SIGNUP - LOOKING UP IF USER EXISTS, FOUND:", user);
      if (user) {
        res.redirect("/signup");
      } else {
        console.log("SIGNING UP NEW USER:", username);
        // we want to move the rest of the code we had below here because
        // if they are not creating a new user, the rest doesn't need to happen
        // That's why we were getting the "Getting HTTP error:"
        // " Unhandled rejection Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
        // it would go into the other ".then"s and try to redirect the user again to res.redirect('/')
        return models.Users.create(req.body)
          .then(results => {
            // after we create a new user we want to create a new session for them?
            var userId = results.insertId;
            console.log(
              "USER CREATED - CREATING A SESSION FOR USER ID:",
              userId
            );
            return models.Sessions.create({ userId });
          })
          .then(results => {
            console.log("CREATED USER AND SESSION");
            res.redirect("/");
            next();
          });
      } // end of block for creating new users
    })
    .catch(err => {
      throw err;
    });
  // .then(results => {
  //   if (results) {
  //     var userId = results.insertId;
  //     console.log("CREATING A SESSION FOR:", userId);
  //     return models.Sessions.create({ userId });
  //   }
  // })
  // .then(results => {
  //   if (results) {
  //     console.log("CREATED USER");
  //     res.redirect("/");
  //   }
  //   next();
  // })
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get("/:code", (req, res, next) => {
  return models.Links.get({ code: req.params.code })
    .tap(link => {
      if (!link) {
        throw new Error("Link does not exist");
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect("/");
    });
});

module.exports = app;
