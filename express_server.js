const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

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
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

app.get(`/u/:shortURL`, (req, res) => {
  // must specify http:// at the start of it
  const longURL = urlDatabase[req.params.shortURL]
// http://localhost:8080/u/undefined
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  console.log(req.body.longURL) //logs the POST request
  let shortString = generateRandomString()
  urlDatabase[shortString] = req.body.longURL
  console.log(urlDatabase)
  res.redirect(`/urls/${shortString}`)
})

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase }
  res.render("urls_index", templateVars)
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
})

  app.get("/urls/:shortURL", (req, res) => {
  // by defining these variables prior to placing them into template vars it makes it much easier to understand
  // short URL is a few letter encoded url
  const shortURL = req.params.shortURL
  // Long url is the full length of our URL in an unshortended state
  const longURL = urlDatabase[shortURL]
  // Template vars contains both our values
  const templateVars = { shortURL, longURL }
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase)
}) 

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});