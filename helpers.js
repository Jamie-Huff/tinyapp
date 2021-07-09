const userExistsChecker = function(email, database) {
  for (const user in database) {
    if(database[user].email === email) {
      return user;
    }
  }
  return false;
};

const generateRandomString = function() {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

module.exports = { userExistsChecker, generateRandomString, }