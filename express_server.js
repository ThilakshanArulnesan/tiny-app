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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/register", (req, res) => {

  let userID = req.cookies["user_id"];
  let user = findUserById(userID);
  let templateVars = { user };

  res.render("urls_createAccount", templateVars);
});

app.post("/register", (req, res) => {
  let newUser = req.body.email;
  let pswd = req.body.password;

  if (!newUser || !pswd) {
    res.status(400).send("Invalid e-mail and/or password");
  }

  if (alreadyRegistered(newUser)) {
    res.status(400).send("E-mail already registered");
  }
  //Adds the new user
  users[newUser] = {};
  users[newUser].id = generateRandomString(); //Should really check if ID not used
  users[newUser].email = newUser;
  users[newUser].password = pswd; //Should hash this


  res.cookie("user_id", users[newUser].id);
  res.redirect("/urls");

});

app.post("/login", (req, res) => {
  //Grab the user by the e-mail
  let user = findUserByEmail(req.body.email);
  let pswdAttempt = req.body.password;
  if (!user || !pswdAttempt) {
    res.status(400).send("Invalid e-mail and/or password");
  }

  if (!passwordCheck(user.password, pswdAttempt)) {
    //Failed password:
    res.status(400).send("Invalid e-mail and/or password");
  }

  res.cookie("user_id", user.id); //Logs the user in
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
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
  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  let userID = req.cookies["user_id"];
  let user = findUserById(userID);
  let templateVars = { urls: urlDatabase, user };

  res.render("urls_index", templateVars);
});



app.get("/urls/new", (req, res) => {
  let userID = req.cookies["user_id"];
  let user = findUserById(userID);
  let templateVars = { user };

  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {

  let userID = req.cookies["user_id"];
  let user = findUserById(userID);

  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user,
  }; //Must send as an object

  res.render("urls_show", templateVars); //don't need extension or path since /views is a standard

});




app.get("/urls.json", (req, res) => {
  //displays all urls as a JSON
  res.json(302, `/urls/${shortenedURL}`);
});

app.post("/urls", (req, res) => {
  let shortenedURL = generateRandomString(); //
  urlDatabase[shortenedURL] = req.body.longURL; //maps shortLink to long link

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

  console.log(`The random coded is : ${retString}`);
  return retString;
};

const alreadyRegistered = function(userName) {
  //Checks if user is already registered
  for (let user in users) {
    if (user === userName) {
      return true;
    }
  }
  return false;

}

const findUserById = function(userID) {
  if (!userID) {
    return undefined;
  }

  for (let user in users) {
    if (users[user].id === userID) {
      return users[user];//return the entire user object
    }
  }

  return undefined;
}

const findUserByEmail = function(email) {
  if (!email) {
    return undefined;
  }

  for (let user in users) {
    if (users[user].email === email) {
      return users[user];//return the entire user object
    }
  }
  return undefined;
}

const passwordCheck = function(actual, guess) {
  return actual === guess;
}
