const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require(`body-parser`);
//const cookieParser = require('cookie-parser'); //No longer required
const bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')
const { getUserByEmail, generateRandomString, alreadyRegistered, urlsForUser, passwordCheck, findUserById } = require('./helpers');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));//Parases the body of all requests as strings, and saves it as "requests.body"
app.use(cookieSession({
  name: 'session',
  keys: ["kdoxk!012x", "adkekKey1"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));



const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    date: new Date(),
    numVisits: 0,
    visitedBy: [] //Array of unique user ids
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    date: new Date(),
    numVisits: 0,
    visitedBy: [] //Array of unique user ids
  }
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
  //If logged in:
  let userID = req.session.user_id;
  let user = findUserById(userID, users);
  if (user && userID) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});


app.get("/register", (req, res) => {

  let userID = req.session.user_id;
  let user = findUserById(userID, users);
  let templateVars = { user };
  if (user) {

    res.redirect("/urls")

  } else {

    res.render("urls_createAccount", templateVars);
  }
});

app.post("/register", (req, res) => {
  let newUser = req.body.email;
  let pswd = req.body.password;

  if (!newUser || !pswd) { //Checks if the user has supplied a username/pswd combination
    res.status(400).send("Invalid e-mail and/or password");
    return;
  }

  pswd = bcrypt.hashSync(pswd, 10); //generates a hash with 10 salt rounds

  if (alreadyRegistered(newUser, users)) { //Checks if the user already has created an account
    res.status(400).send("E-mail already registered");
    return;
  }
  //Adds the new user
  users[newUser] = {};
  users[newUser].id = generateRandomString(); //Should really check if ID not used
  users[newUser].email = newUser;
  users[newUser].password = pswd;


  //res.cookie("user_id", users[newUser].id);
  req.session.user_id = users[newUser].id;
  res.redirect("/urls");

});

app.get("/login", (req, res) => {

  let userID = req.session.user_id;
  let user = findUserById(userID, users);
  let templateVars = { user };

  if (user) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

app.post("/login", (req, res) => {

  // Note the requirements called for two different messages for e-mail not found and incorrect password
  // But it would be better for security if users got the same message whether the user existed or not
  // and the message should not indicate whether it was the password or the username that failed.
  let user = getUserByEmail(req.body.email, users);
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

  //res.cookie("user_id", user.id); //Logs the user in
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


app.post("/urls/:shortURL/delete", (req, res) => {
  //Deletes a url from from the list. Done on a POST request (not ideal)
  //Delete the shortURL entry from the database
  let shortURL = req.params.shortURL;
  //Check if the user is allowed to post
  let userID = req.session.user_id;
  let user = findUserById(userID, users);

  let filteredURLs = urlsForUser(userID, urlDatabase);

  if (!userID || !user) {
    //Only allows users who have signed in to make changes.
    res.send("Please make sure you are logged in to delete a URL");
    return;
  }
  if (!filteredURLs.hasOwnProperty(shortURL)) {
    //does not allow users to delete URLS they do not own. Users will only be able to reach this without logging in
    // if a request is sent outide of the browser.
    res.status(404).send("URL not found. Please make sure you have chosen an existing shortURL.");
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
  let userID = req.session.user_id;
  let user = findUserById(userID, users);


  let date = new Date(); //Stores creation date
  let numVisits = 0; //Stores how many times visited
  let visitedBy = []; //Stores ids of users who use the link

  let filteredURLs = urlsForUser(userID, urlDatabase);

  if (!userID || !user) {
    //Checks to make sure user is logged in
    res.send("Please make sure you are logged in to submit a new url");
    return;
  }

  if (!filteredURLs.hasOwnProperty(shortURL) && urlDatabase.hasOwnProperty(shortURL)) {
    //User is requesting to edit something they don't have access to:
    res.status(401).send("You do not have access to modify this url. Please make sure you are logged into the right account  ");
  }

  if (!filteredURLs.hasOwnProperty(shortURL)) {
    //Makes sure that the user has that particular URL
    res.send("Please make sure you are editing your own shortURL (check that you are logged into the right account!)");
  }
  //Assumption: We are going to reset the statistics and the date on edits
  urlDatabase[shortURL] = {
    longURL: newURL,
    userID,
    date,
    numVisits,
    visitedBy
  };

  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  let user = findUserById(userID, users);

  if (!userID || !user) {
    let templateVars = { urls: {}, user };
    res.render("urls_index", templateVars);
    return;
  }


  let filteredURLs = urlsForUser(userID, urlDatabase);
  let templateVars = { urls: filteredURLs, user };

  res.render("urls_index", templateVars);
});



app.get("/urls/new", (req, res) => {
  let userID = req.session.user_id;
  let user = findUserById(userID, users);
  if (!userID || !user) {
    res.redirect("/login");
    return;
  }

  let templateVars = { user };

  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {

  let userID = req.session.user_id;



  let user = findUserById(userID, users);

  if (!user) {
    res.send(`<h1 style="color:red">Please login to access the url editor </p>`);
  }
  let filteredURLs = urlsForUser(userID, urlDatabase);

  let templateVars = {};
  if (filteredURLs && filteredURLs[req.params.shortURL]) { //If url exists
    templateVars = {
      shortURL: req.params.shortURL,
      longURL: filteredURLs[req.params.shortURL].longURL,
      date: filteredURLs[req.params.shortURL].date,
      numVisits: filteredURLs[req.params.shortURL].numVisits,
      visitedBy: filteredURLs[req.params.shortURL].visitedBy,
      user
    };//Must send as an object

  } else {
    templateVars = {
      shortURL: req.params.shortURL,
      longURL: undefined,
      user
    };
  }



  res.render("urls_show", templateVars); //don't need extension or path since /views is a standard

});




app.get("/urls.json", (req, res) => {
  //displays all urls as a JSON
  res.json(urlDatabase);
});

app.post("/urls", (req, res) => {
  //Creates a shortened url
  let shortenedURL = generateRandomString();
  let date = new Date();
  let numVisits = 0;
  let visitedBy = [];

  urlDatabase[shortenedURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    date,
    numVisits,
    visitedBy
  };
  res.redirect(302, `/urls/${shortenedURL}`);

});

app.get("/u/:shortURL", (req, res) => {
  //Redirects to long url
  let longURL;

  let userID = req.session.user_id;
  console.log("visited by ", userID);
  const obj = urlDatabase[req.params.shortURL];


  if (obj) {
    longURL = obj.longURL;
  } else {
    ``
    longURL = undefined;
  }

  if (longURL !== undefined) {
    obj.numVisits++; //Increment number of visits as we are about to redirect the user.

    if (!obj.visitedBy.includes(userID)) {
      obj.visitedBy.push(userID);//adds users who have visited the link (unique users only)
    }

    res.redirect(longURL);
    return;
  }

  res.status(404).send("Url not found. Please check that you have properly copied the link.");
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});

