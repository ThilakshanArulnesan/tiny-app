const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require(`body-parser`);
const cookieParser = require('cookie-parser')

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));//Parases the body of all requests as strings, and saves it as "requests.body"
app.use(cookieParser())



const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.post("/login", (req, res) => {

  res.cookie("username", req.body.username); //Check this!
  res.redirect("/urls");
});


app.post("/urls/:shortURL/delete", (req, res) => {
  //Deletes a url from from the list. Done on a POST request (not ideal)
  //Delete the shortURL entry from the database

  delete urlDatabase[req.params.shortURL]; //Deltes the short url
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  //Renames a url

  let newURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = newURL; //Replaces the site

  let templateVars = {
    username: req.cookies["username"],
    // ... any other vars
  };

  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});



app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    // ... any other vars
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {

  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"],
  }; //Must send as an object
  console.log(req.params.shortURL);
  console.log(urlDatabase[req.params.shortURL]);

  res.render("urls_show", templateVars); //don't need extension or path since /views is a standard

});




app.get("/urls.json", (req, res) => {
  res.json(302, `/urls/${shortenedURL}`);
});

app.post("/urls", (req, res) => {
  let shortenedURL = generateRandomString();
  urlDatabase[shortenedURL] = req.body.longURL;

  let templateVars = {
    username: req.cookies["username"],
    // ... any other vars
  };

  console.log(urlDatabase);
  res.redirect(302, `/urls/${shortenedURL}`);

});

app.get("/u/:shortURL", (req, res) => {
  //Redirects to long url
  console.log(req.params.shortURL);
  const longURL = urlDatabase[req.params.shortURL]
  console.log(longURL);



  if (longURL !== undefined)
    res.redirect(longURL);

  res.send("URL NOT FOUND");
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});

const generateRandomString = function(numGenerate = 6) {
  //Generate a string of 6 alpha-numeric characters
  let characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let retString = "";
  for (let i = 0; i < numGenerate; i++) {
    let rng = Math.floor(Math.random() * 62);
    retString += characters[rng];
  }

  console.log(`The random conde is : ${retString}`);
  return retString;
};
