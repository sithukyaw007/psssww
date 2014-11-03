'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/psssw-dev'
  },
  facebook: {
    clientID:     '1497409807186051'|| 'id',
    clientSecret: '5a816ee501642792c733183c19655435'|| 'secret',
    callbackURL:  'http://localhost:9000/auth/facebook/callback'
  }
};
