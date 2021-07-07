const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const PORT = 8080;
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userDB = {
  "jamieID": {
    id: 1,
    email: "dog@email.com",
    password: "dog"
  },
  "testID": {
    id: 2,
    email: "test@email.com",
    password: "123"
  }
};

const userExistsChecker = function(email) {
  for (const user in userDB) {
    if(userDB[user].email === email) {
      return true;
    }
  }
  return false;
};

const generateRandomString = function() {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

app.get(`/u/:shortURL`, (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  // console.log(req.body.longURL) //logs the POST request
  let shortString = generateRandomString();
  if (!req.body.longURL.startsWith("http://")) {
    let starting = 'http://';
    urlDatabase[shortString] = starting + req.body.longURL;
  } else {
    urlDatabase[shortString] = req.body.longURL;
  }
  res.redirect(`/urls/${shortString}`);
});

app.get('/urls', (req, res) => {
  const user = userDB[req.cookies["id"]];
  const templateVars = { urls: urlDatabase, user}; // this is the cookie being created when we make a new account

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = userDB[req.cookies["id"]];
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const user = userDB[req.cookies["id"]];
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
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post(("/urls/:shortURL/delete"), (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get(("/login"), (req, res) => {
  const user = userDB[req.cookies["id"]];
  const templateVars = { user };
  templateVars.message = null;
  res.render("urls_login", templateVars);
});

app.post(("/login"), (req, res) => {
  const attemptedLoginEmail = req.body.email;
  const attemptedLoginPassword = req.body.password;

  for (const user in userDB) {
    // if ( userDB[user].email === attemptedLoginEmail) {
    if ( userExistsChecker(attemptedLoginEmail)) {
      if (userDB[user].password === attemptedLoginPassword) {
        res.cookie("id", user);
        res.redirect("/urls")
      }
    }
  }
  res.redirect("/login");
});

app.post(("/logout"), (req, res) => {
  res.clearCookie('id');
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const templateVars = { user: null};

  if (!email || !password) {
    templateVars.message = "Error 400 - Bad Request";
    res.render("urls_register", templateVars);
  } else if (userExistsChecker(email)) {
    templateVars.message = "email already associated with an account";
    res.render("urls_register", templateVars);
  }
  else {
    userDB[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("id", userID);
    res.redirect("/urls");
  }

});

app.get("/register", (req, res) => {
  const user = userDB[req.cookies["id"]];
  const templateVars = { user };
  templateVars.message = null;
  res.render("urls_register", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



/*
Things to implement:

1. Short URL doesn't work if it does not start with http://

*/