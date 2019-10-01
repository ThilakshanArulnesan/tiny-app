
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

module.exports = { getUserByEmail };
