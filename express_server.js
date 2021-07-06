const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase }
  res.render("urls_index", templateVars)
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

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
})

app.get("/set", (req, res) => {
  const a = 1
  res.send(`a = ${a}`)
})

app.get("/fetch", (req, res) => {
  const a = 1
  res.send(`a = ${a}`)
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});