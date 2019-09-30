const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase }; //Must send as an object
  res.render("urls_index", templateVars); //don't need extension or path since /views is a standard

});
app.get("/urls/:shortURL", (req, res) => {

  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  }; //Must send as an object
  console.log(req.params.shortURL);
  console.log(urlDatabase[req.params.shortURL]);

  res.render("urls_show", templateVars); //don't need extension or path since /views is a standard

});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});
