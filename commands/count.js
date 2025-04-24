'use strict';

var redis = require('redis');

module.exports = function(redisAddress, pattern, callback) {
  redisAddress = redisAddress || {};
  redisAddress.hostname = redisAddress.hostname || '127.0.0.1';
  redisAddress.auth = redisAddress.auth || '';
  redisAddress.port = redisAddress.port || 6379;
  redisAddress.db = redisAddress.db || 0;
  redisAddress.tls = redisAddress.tls || null;

  pattern = pattern || '*';

  var options = {
    auth_pass: redisAddress.auth
  };

  if (redisAddress.tls !== null) {
    options.tls = redisAddress.tls;
  }
  
  // Connect to the Redis instance
  var db = redis.createClient(redisAddress.port, redisAddress.hostname, options);
  db.select(redisAddress.db);

  // Get the keys that match the specified pattern
  db.keys(pattern, function(keysErr, keys) {
    // Close Redis connection
    db.end();

    if (keysErr) {
      return callback(keysErr);
    } else {
      console.log('Found %d keys matching the specified pattern.', keys.length);
      return callback(null, 0);
    }
  });
};
