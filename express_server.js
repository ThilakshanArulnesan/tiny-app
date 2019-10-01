const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require(`body-parser`);
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));//Parases the body of all requests as strings, and saves it as "requests.body"
app.use(cookieParser());



const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
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
};

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

  if (!newUser || !pswd) { //Checks if the user has supplied a username/pswd combination
    res.status(400).send("Invalid e-mail and/or password");
    return;
  }

  if (alreadyRegistered(newUser)) { //Checks if the user already has created an account
    res.status(400).send("E-mail already registered");
    return;
  }
  //Adds the new user
  users[newUser] = {};
  users[newUser].id = generateRandomString(); //Should really check if ID not used
  users[newUser].email = newUser;
  users[newUser].password = pswd; //Should hash this


  res.cookie("user_id", users[newUser].id);
  res.redirect("/urls");

});

app.get("/login", (req, res) => {

  let userID = req.cookies["user_id"];
  let user = findUserById(userID);
  let templateVars = { user };

  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {

  // Note the requirements called for two different messages for e-mail not found and incorrect password
  // But it would be better for security if users got the same message whether the user existed or not
  // and the message should not indicate whether it was the password or the username that failed.
  let user = findUserByEmail(req.body.email);
  if (!user) {
    res.status(401).send("User not found.");
    return;
  }

  let pswdAttempt = req.body.password;
  if (!user || !pswdAttempt) {
    res.status(401).send("Invalid password/username");
    return;
  }

  if (!passwordCheck(user.password, pswdAttempt)) {
    //Failed password:
    res.status(401).send("Incorrect password, please try again.");
    return;
  }

  res.cookie("user_id", user.id); //Logs the user in
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});


app.post("/urls/:shortURL/delete", (req, res) => {
  //Deletes a url from from the list. Done on a POST request (not ideal)
  //Delete the shortURL entry from the database
  console.log("Trying to delete");
  let shortURL = req.params.shortURL;
  //Check if the user is allowed to post
  let userID = req.cookies["user_id"];
  let user = findUserById(userID);

  let filteredURLs = urlsForUser(userID);

  if (!userID || !user || !filteredURLs.hasOwnProperty(shortURL)) {
    //does not allow users to delete URLS they do not own. Users will only be able to reach this without logging in
    // if a request is sent outide of the browser.
    res.send("Please make sure you are logged in to delete a URL");
    return;
  }

  delete urlDatabase[shortURL]; //Deltes the short url
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  //Renames a url

  let newURL = req.body.longURL;
  let shortURL = req.params.shortURL;
  //Check if the user is allowed to post
  let userID = req.cookies["user_id"];
  let user = findUserById(userID);

  let filteredURLs = urlsForUser(userID);

  if (!userID || !user || !filteredURLs.hasOwnProperty(shortURL)) {
    res.send("Please make sure you are logged in to submit a new url");
    return;
  }

  urlDatabase[shortURL] = { longURL: newURL, userID }; //Replaces the site
  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  let userID = req.cookies["user_id"];
  let user = findUserById(userID);

  if (!userID || !user) {
    let templateVars = { urls: {}, user };
    res.render("urls_index", templateVars);
    return;
  }


  let filteredURLs = urlsForUser(userID);
  let templateVars = { urls: filteredURLs, user };

  res.render("urls_index", templateVars);
});



app.get("/urls/new", (req, res) => {
  let userID = req.cookies["user_id"];
  let user = findUserById(userID);
  if (!userID || !user) {
    res.redirect("/login");
    return;
  }

  let templateVars = { user };

  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {

  let userID = req.cookies["user_id"];
  let user = findUserById(userID);
  let filteredURLs = urlsForUser(userID);
  let templateVars = {};
  if (filteredURLs && filteredURLs[req.params.shortURL]) { //If url exists
    templateVars = {
      shortURL: req.params.shortURL,
      longURL: filteredURLs[req.params.shortURL],
      user,
    };//Must send as an object

  } else {
    templateVars = {
      shortURL: req.params.shortURL,
      longURL: undefined,
      user,
    };
  }



  res.render("urls_show", templateVars); //don't need extension or path since /views is a standard

});




app.get("/urls.json", (req, res) => {
  //displays all urls as a JSON
  res.json(urlDatabase);
});

app.post("/urls", (req, res) => {
  let shortenedURL = generateRandomString(); //
  urlDatabase[shortenedURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  }
  res.redirect(302, `/urls/${shortenedURL}`);

});

app.get("/u/:shortURL", (req, res) => {
  //Redirects to long url
  let longURL;

  const obj = urlDatabase[req.params.shortURL];
  if (obj) {
    longURL = obj.longURL;
  } else {
    longURL = undefined;
  }

  if (longURL !== undefined) {
    res.redirect(longURL);
    return;
  }

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
};

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
};

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
};

const passwordCheck = function(actual, guess) {
  return actual === guess;
};

const urlsForUser = function(id) {
  //Given a user will find all urls that match for that user:
  let retObj = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) { //Only adds urls associated with the given user.
      retObj[shortURL] = urlDatabase[shortURL].longURL;
    }
  }
  return retObj;
}
/*
const isLoggedIn = function(id) {
  if (id === undefined) {
    return false;
  }
  if (findUserById(id)) {
    return true;
  }
  return false;
}

*/
