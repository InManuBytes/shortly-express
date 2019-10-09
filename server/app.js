const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils'); // unique to this app
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models'); //unique to this app

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));


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

app.post('/login', (req, res, next) => {
  // determine if they actually are a user in the database
  // if they don't exist we need to send them to the signup page
  // we need the username and the password
  // test if they are correct
  // if they are correct update the session
  // redirect to the homepage
  req.body.username
});

app.post('/signup', (req, res, next) => {
  console.log("REQ.BODY",req.body); // { username: 'Samantha', password: 'Samantha' }
  // check if the user is in the database already
  let username = req.body.username;
  // HARD CODING QUERY WITH ADDING PRIVATE FUNCTION INTO MODEL DIDN'T WORK
  // models.Users.executeQuery(`SELECT * from users where username = ?`,[username])
  //   .then(results => {
  //     console.log("RESULTS", results)
  //   });
  // return models.Users.get({username})
  //   .then(results => {
  //     console.log("RESULTS", results);
  //   })
  //   .catch((err) => {
  //     throw err;
  //   });
  // if they are in the database, redirect to login
  // Otherwise
  // add user to database
  // WORKING UP TO DUPLICATE USERS
  models.Users.create(req.body)
    .then((results) => {
      console.log('RESULTS FROM CREATED USER', results);
    })
  next();
  // upgrade the session
  // redirect to homepage
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
