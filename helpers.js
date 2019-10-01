const bcrypt = require('bcrypt');


const getUserByEmail = function(email, database) {
  if (!email) {
    return undefined;
  }

  for (let user in database) {
    if (database[user].email === email) {
      return database[user];//return the entire user object
    }
  }
  return undefined; //Couldn't find them
};


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



const alreadyRegistered = function(userName, users) {
  //Checks if user is already registered
  for (let user in users) {
    if (user === userName) {
      return true;
    }
  }
  return false;
};



const urlsForUser = function(id, urlDatabase) {
  //Given a user will find all urls that match for that user:
  let retObj = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) { //Only adds urls associated with the given user.
      retObj[shortURL] = urlDatabase[shortURL];
    }
  }
  return retObj;
};


const passwordCheck = function(encrypted, guess) {
  return bcrypt.compareSync(guess, encrypted); // returns true
};



const findUserById = function(userID, users) {
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


module.exports = { getUserByEmail, generateRandomString, alreadyRegistered, urlsForUser, passwordCheck, findUserById };
