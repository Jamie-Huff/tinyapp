const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const PORT = 8080;
const app = express();
const bcrypt = require('bcrypt');
const helperFuncs = require('./helpers');
const generateRandomString = helperFuncs.generateRandomString;
const userExistsChecker = helperFuncs.userExistsChecker;

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['NoodleSoupEatenByMyD0G', 'TableDragOOnnOOdle']
}));
app.set("view engine", "ejs");

/* urlDatabase contains the longURL's shortstring as its key. User ID represents the user who created the link */

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 1
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 2
  },
};
// No passwords are stored in plain text, only in a hashed and salted format.
// User Id's are randomly generated strings 
const userDB = {
  1: {
    id: 1,
    email: "dog@email.com",
    hashedPassword: '$2b$10$DNhVgHnauVpWOeqrZUVsp.0gYUz.Ox.MzWNZfQ7FKlCFlKBwP1TN.'
  },
  2: {
    id: 2,
    email: "test@email.com",
    hashedPassword: '$2b$10$ckDeYHTwTfVc8dZa2r8LaufDzmM.FgdJzz3xX6jgg3jFhHwmwSHbG'
  }
};

// Homepage.
app.get('/', (req, res) => {
  let user = userDB[req.session.user_id];
  if (!user) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// Link sends client to longURL's webpage if defined.
app.get(`/u/:shortURL`, (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send('<h1>Error 404 - Page does not exist.</h1>');
  }
  longURL = longURL.longURL;
  res.redirect(longURL);
});

// POST to add new urls to a user's /urls page.
app.post("/urls", (req, res) => {
  let shortString = generateRandomString();
  let user = userDB[req.session.user_id];
  user = user.id;
// Ensures all URLS start with http:// if they don't already.
  if (!req.body.longURL.startsWith("http://" || "https://")) {
    let starting = 'http://';
    urlDatabase[shortString] = { longURL: starting + req.body.longURL, userID: user };
  } else {
    urlDatabase[shortString] = { longURL: req.body.longURL, userID: user};
  }
  res.redirect(`/urls/${shortString}`);
});

// Access a users urls, only available to the relative user
app.get('/urls', (req, res) => {
  let user = userDB[req.session.user_id];
  let userID = '';
  if (user) {
    userID = user.id;
  }
  let templateVars = { user, urls: []};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      templateVars.urls.push({shortURL: url,longURL: urlDatabase[url].longURL});
    }
  }
  res.render("urls_index", templateVars);
});

// GET request to create a new page. Only accessable to users who are logged in to a profile, otherwise redirects to /login.
app.get("/urls/new", (req, res) => {
  let user = userDB[req.session.user_id];
  if (!user) {
    let templateVars = { user, };
    templateVars.message = 'Please login, or create an account to access this feature.';
    return res.render("urls_login", templateVars);
  }
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  return res.render("urls_new", templateVars);
});

// Page accessed after creating a new url || selecting edit on the /urls page. 
// Only available to the creating user of that relative url.
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  if (!longURL) {
    res.status(404).send('<h1>Error 404 - Page does not exist.</h1>');
  }
  let user = userDB[req.session.user_id];
  if (!user || user.id !== urlDatabase[shortURL].userID) {
    return res.status(401).send('<h1>Error 401 - You are not authorized to access this page.</h1>');
  }
  longURL = longURL.longURL;
  const templateVars = {
    shortURL,
    longURL,
    user,
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// POST for when a user changes the longURL of a pre existing link, checks for http:// || https://. 
// Only available to the creator of that link.
app.post(("/urls/:shortURL"), (req, res) => {
  let user = userDB[req.session.user_id];
  user = user.id;
  if (!req.body.longURL.startsWith("http://" || "https://")) {
    req.body.longURL = `http://${req.body.longURL}`;
  }
  urlDatabase[req.params.shortURL] = { longURL: req.body.longURL, userID: user };
  res.redirect(`/urls/${req.params.shortURL}`);
});

// POST to delete a pre existing link, only available to the creator of that link.
app.post(("/urls/:shortURL/delete"), (req, res) => {
  const user = userDB[req.session.user_id];
  const shortURL = req.params.shortURL;
  const recordOwner = (urlDatabase[shortURL].userID);
  if (!user) {
    res.redirect('/login');
    return;
  }
  const userAttemptingAccess = user.id;
  if (recordOwner !== userAttemptingAccess) {
    return res.redirect("/login");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Access the login page, if user is already logged in, redirects to /urls.
app.get(("/login"), (req, res) => {
  const user = userDB[req.session.user_id];
  if (user) {
    return res.redirect("/urls");
  }
  const templateVars = { user };
  templateVars.message = null;
  res.render("urls_login", templateVars);
});

// Login to an account. Gives relative errors depending on the issue.
app.post(("/login"), (req, res) => {
  const attemptedLoginEmail = req.body.email;
  const attemptedLoginPassword = req.body.password;
  const templateVars = { user: null};
  for (const user in userDB) {
    if (userExistsChecker(attemptedLoginEmail, userDB) && userDB[user].email === attemptedLoginEmail) {
      if (bcrypt.compareSync(attemptedLoginPassword, userDB[user].hashedPassword)) {
        req.session.user_id = user;
        return res.redirect("/urls");
      } else {
        templateVars.message = "Error 403 - Password is invalid.";
        return res.render("urls_login", templateVars);
      }
    } else if (!userExistsChecker(attemptedLoginEmail, userDB)) {
      templateVars.message = "Error 403 - Email is not associated with an account.";
      return res.render("urls_login", templateVars);
    }
  }
});

// Logout and clear cookies for client.
app.post(("/logout"), (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// Create new user. Sends errors for empty fields, or if an email is already being used.
app.post("/register", (req, res) => {
  let userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const templateVars = { user: null};

  if (!email || !password) {
    templateVars.message = "Error 400 - Bad request - Email or Password fields cannot be empty.";
    return res.render("urls_register", templateVars);

  } else if (userExistsChecker(email, userDB)) {
    templateVars.message = "An account already exists for this email address.";
    return res.render("urls_register", templateVars);

  } else {
    userDB[userID] = {
      id: userID,
      email: req.body.email,
      hashedPassword: hashedPassword
    };
    req.session.user_id = userID;
    res.redirect("/urls");
  }

});

// Access the login page. If a user is already logged in redirects to /urls.
app.get("/register", (req, res) => {
  const user = userDB[req.session.user_id];
  if (user) {
    return res.redirect("/urls");
  }
  const templateVars = { user };
  templateVars.message = null;
  res.render("urls_register", templateVars);
});

// Starts server.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
