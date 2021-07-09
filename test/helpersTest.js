const { assert } = require('chai');

const userExistsChecker = require('../helpers.js');

const testUsers = {
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

describe('userExistsChecker', function() {
  it('should return a user with valid email', function() {
    const user = userExistsChecker("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    assert.equal(user, expectedOutput)
  });
  it('should return false if a user is not in our database', function() {
    const user = userExistsChecker("dog@dog.pizza", testUsers)
    const expectedOutput = false
    assert.equal(user, expectedOutput)
  })

});