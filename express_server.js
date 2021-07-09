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

app.get('/', (req, res) => {
  let user = userDB[req.session.user_id];
  if (!user) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get(`/u/:shortURL`, (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send('<h1>Error 404 - Page does not exist.</h1>');
  }
  longURL = longURL.longURL;
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let shortString = generateRandomString();
  let user = userDB[req.session.user_id];
  user = user.id;
  if (!req.body.longURL.startsWith("http://")) {
    let starting = 'http://';
    urlDatabase[shortString] = { longURL: starting + req.body.longURL, userID: user };
  } else {
    urlDatabase[shortString] = { longURL: req.body.longURL, userID: user};
  }
  res.redirect(`/urls/${shortString}`);
});

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

app.post(("/urls/:shortURL"), (req, res) => {
  let user = userDB[req.session.user_id];
  user = user.id;
  if (!req.body.longURL.startsWith("http://" || "https://")) {
    req.body.longURL = `http://${req.body.longURL}`;
  }
  urlDatabase[req.params.shortURL] = { longURL: req.body.longURL, userID: user };
  res.redirect(`/urls/${req.params.shortURL}`);
});

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

app.get(("/login"), (req, res) => {
  const user = userDB[req.session.user_id];
  if (user) {
    return res.redirect("/urls");
  }
  const templateVars = { user };
  templateVars.message = null;
  res.render("urls_login", templateVars);
});

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

app.post(("/logout"), (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

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

app.get("/register", (req, res) => {
  const user = userDB[req.session.user_id];
  if (user) {
    return res.redirect("/urls");
  }
  const templateVars = { user };
  templateVars.message = null;
  res.render("urls_register", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
