const userExistsChecker = function(email, database) {
  for (const user in database) {
    if(database[user].email === email) {
      return true;
    }
  }
  return false;
};

module.exports = userExistsChecker