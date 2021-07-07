const express = require("express");
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
const PORT = 8080;
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < 6; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

app.get(`/u/:shortURL`, (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  // console.log(req.body.longURL) //logs the POST request
  let shortString = generateRandomString()
  if(!req.body.longURL.startsWith("http://")) {
    let starting = 'http://'
    urlDatabase[shortString] = starting + req.body.longURL
  } else {
    urlDatabase[shortString] = req.body.longURL
  }
  res.redirect(`/urls/${shortString}`)
})

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies['username'] }
  res.render("urls_index", templateVars)
})

app.get("/urls/new", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies['username']
   }
  //  if (req.cookies['username']) {
  //    templateVars.username = req.cookies['username']
  //  }
  res.render("urls_new", templateVars);
})

app.get("/urls/:shortURL", (req, res) => {
const shortURL = req.params.shortURL
const longURL = urlDatabase[shortURL]

const templateVars = { 
  shortURL, 
  longURL,
  username: req.cookies['username']
  }

res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase)
}) 

app.post(("/urls/:shortURL"), (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL
  res.redirect(`/urls/${req.params.shortURL}`)
})

app.post(("/urls/:shortURL/delete"), (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect("/urls")
})

app.post(("/login"), (req, res) => {
  res.cookie("username", req.body.username)
  res.redirect("/urls")
})

app.post(("/logout"), (req, res) => {
  res.clearCookie('username')
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/*
Things to implement:

1. Short URL doesn't work if it does not start with http://

*/