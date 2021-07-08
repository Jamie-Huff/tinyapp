const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const PORT = 8080;
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
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
}

const userDB = [
  {
    id: 1,
    email: "dog@email.com",
    password: "dog"
  },
  {
    id: 2,
    email: "test@email.com",
    password: "123"
  }
];

const userExistsChecker = function(email) {
  for (const user of userDB) {
    if(user.email === email) {
      return true;
    }
  }
  return false;
};

const userPasswordChecker = function(password) {
  for (const user of userDB) {
    if(user.password === password) {
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
  const longURL = urlDatabase[req.params.shortURL].longURL;
  console.log(longURL)
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let shortString = generateRandomString();
  let user = userDB[req.cookies["id"]];
  user = user.id
  if (!req.body.longURL.startsWith("http://")) {
    let starting = 'http://';
    urlDatabase[shortString] = { longURL: starting + req.body.longURL, userID: user }
  } else {
    urlDatabase[shortString] = { longURL: req.body.longURL, userID: user};
  }
  res.redirect(`/urls/${shortString}`);
});

app.get('/urls', (req, res) => {
  let user = userDB[req.cookies["id"]];
  console.log(user)
  let userID = ''
  if (user) {
    userID = user.id
  }
  let templateVars = { user, urls: []}
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      templateVars.urls.push({shortURL: url,longURL: urlDatabase[url].longURL});
    }
  }
  //templateVars = { urls: urlDatabase, user}; // this is the cookie being created when we make a new account
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let user = userDB[req.cookies["id"]];
  
  if (!user) {
    return res.redirect("/login")
  }
  user = user.id
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  //let user = req.cookies["id"];
  let user = userDB[req.cookies["id"]]
  user = user

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
  let user = userDB[req.cookies["id"]]
  user = user.id
  urlDatabase[req.params.shortURL] = { longURL: req.body.longURL, userID: user }
  //need to fix
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
  const templateVars = { user: null};

  for (const user in userDB) {
    // if ( userDB[user].email === attemptedLoginEmail) {
    if (userExistsChecker(attemptedLoginEmail)) {
      //if (userDB[user].password === attemptedLoginPassword) {
      if (userPasswordChecker(attemptedLoginPassword)) {
        res.cookie("id", user);
        res.redirect("/urls");
        return;
      } else {
        templateVars.message = "Error 403 - Password is invalid.";
        return res.render("urls_login", templateVars);
      }
    } else if (!userExistsChecker(attemptedLoginEmail)) {
      templateVars.message = "Error 403 - Email is not associated with an account.";
      return res.render("urls_login", templateVars);
    }
  }
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
    templateVars.message = "Error 400 - Bad request - Email or Password fields cannot be empty.";
    return res.render("urls_register", templateVars);
  } else if (userExistsChecker(email)) {
    templateVars.message = "Email already associated with an account.";
    return res.render("urls_register", templateVars);
  } else {
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