const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils'); // unique to this app
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth.js');
const cookieParser = require('./middleware/cookieParser.js');
const models = require('./models'); //unique to this app

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser);
app.use(Auth.createSession);


// all routes here
app.get('/',
(req, res) => {
  res.render('index');
});

app.get('/create',
(req, res) => {
  res.render('index');
});

app.get('/links',
(req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links',
(req, res, next) => {
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

app.post('/login', (req, res, next) => {
  let username = req.body.username;
  let attempted = req.body.password;
  // determine if they actually are a user in the database
  return models.Users.get({username})
    .then(user =>{
      if (!user) {
        // if they don't exist we need to send them to the signup page?
        // but the tests are written such that the user is redirected to login page
        res.redirect('/login');
      } else {
        // we need the username and the password
        // test if they are correct
        return user;
      }
    })
    .then((record) => {
      //console.log("RECORD", record);
      return models.Users.compare(attempted, record.password, record.salt);
      // if (!models.Users.compare({attempted, record.password, record.salt})) {
      //   res.redirect('/login');
      // }
    })
    .then((rightPassword) => {
      // if they are correct update the session?
      if (!rightPassword) {
        res.redirect('/login');
      } else {
        // redirect to the homepage
        res.redirect('/');
      }
    })
    next();
});

app.post('/signup', (req, res, next) => {
  //console.log("REQ.BODY",req.body); // { username: 'Samantha', password: 'Samantha' }
  // check if the user is in the database already
  let username = req.body.username;

  // get(options) → {Promise.<Object>}
  return models.Users.get({username})
  .then(user => {
    //console.log('GET USER RESULTS:', user);
    if (user) {
      // // Otherwise
      // // add user to database
      // return models.Users.create(req.body);
      // next();
      res.redirect('/signup')
    } else {
      return models.Users.create(req.body);
      // if they are in the database, redirect to login
    }
  })
  .then(results => {
      //console.log('CREATED USER');
      res.redirect('/');
      next();
  })
  .catch((err) => {
      throw err;
  });
  // Getting HTTP error:
  // Unhandled rejection Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
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
      res.redirect('/');
    });
});

module.exports = app;
