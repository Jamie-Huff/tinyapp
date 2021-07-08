const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const PORT = 8080;
const app = express();
const bcrypt = require('bcrypt');

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
  const longURL = urlDatabase[req.params.shortURL].longURL;
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
  user = user
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  // need to implement error message if you try to edit someone elses url
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  //let user = req.cookies["id"];
  let user = userDB[req.cookies["id"]]
  console.log(user)
  if (!user) {
    return res.redirect('/login')
  }
  if (user.id !== urlDatabase[shortURL].userID) {
    const templateVars = {user, error:"You don't have access to make changes to that URL"}
    res.redirect("/login")
    return
  }
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
  const user = userDB[req.cookies["id"]]
  const shortURL = req.params.shortURL
  const recordOwner = (urlDatabase[shortURL].userID)
  if (!user) {
    res.redirect('/login')
    return
  }
  const userAttemptingAccess = user
  if (recordOwner !== userAttemptingAccess) {
    const templateVars = {user, error:"You don't have access to make changes to that URL"}
    res.redirect("/login")
    return
  }
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
    //console.log(attemptedLoginPassword, userDB[user].hashedPassword)
    //console.log(bcrypt.compareSync(attemptedLoginPassword, userDB[user].hashedPassword))

    if (userExistsChecker(attemptedLoginEmail) && userDB[user].email === attemptedLoginEmail) {
      console.log('passed first condition')
      if (bcrypt.compareSync(attemptedLoginPassword, userDB[user].hashedPassword)) {
        console.log('passed both conditions')
        res.cookie("id", user);
        res.redirect("/urls");
        return;
      } else {
        console.log('passed 1st failed 2nd condition')
        templateVars.message = "Error 403 - Password is invalid.";
        // need to make some error cookies
        return res.render("urls_login", templateVars);
      }
    } else if (!userExistsChecker(attemptedLoginEmail)) {
      console.log('failed userExistChecker')
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
  const hashedPassword = bcrypt.hashSync(password, 10)
  const templateVars = { user: null};
  console.log(hashedPassword)

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
      hashedPassword: hashedPassword
    };
    console.log(userDB)
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
1. Ensure users edit others urls, NEED: Error Message / error cookie
2. Short URL doesn't work if it does not start with http://
3. sessioncookies vs regular cookies
  - npm install cookie-session
  - const cookieSession = require('cookie-session')

  - app.use(cookieSession({
    name:"session"
    keys: [""]


  }))
*/