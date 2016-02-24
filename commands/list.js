'use strict';

var async = require('async');
var redis = require('redis');

module.exports = function(redisAddress, pattern, callback) {
  redisAddress = redisAddress || {};
  redisAddress.hostname = redisAddress.hostname || '127.0.0.1';
  redisAddress.auth = redisAddress.auth || '';
  redisAddress.port = redisAddress.port || 6379;
  redisAddress.db = redisAddress.db || 0;

  pattern = pattern || '*';

  // Connect to the Redis instance
  var db = redis.createClient(redisAddress.port, redisAddress.hostname, {
    auth_pass: redisAddress.auth
  });
  db.select(redisAddress.db);

  // Get the keys that match the specified pattern
  db.keys(pattern, function(keysErr, keys) {
    if (keysErr) {
      return callback(keysErr);
    } else {
      console.log('Found %d keys matching the specified pattern.', keys.length);

      if (keys.length === 0) {
        return callback(null, 0);
      } else {
        //Get the type and TTL for each key

        keys.sort();

        console.log('Keys:');

        async.eachSeries(keys, function(key, eachCallback) {
          var keyType = null;
          var keyTTL = -1;
          var keyLength = null;
          var keyFields = null;

          async.waterfall([
            // Get the type and ttl
            function(next) {
              var batch = db.batch();

              batch.type(key);
              batch.ttl(key);

              batch.exec(function(err, replies) {
                if (err) {
                  next(err);
                } else {
                  keyType = replies[0];
                  keyTTL = parseInt(replies[1], 10);
                  next(null);
                }
              });
            },

            // Get the fields and length
            function(next) {
              switch (keyType) {
                case 'string':
                  db.strlen(key, function(err, reply) {
                    if (err) {
                      return next(err);
                    } else {
                      keyLength = reply;
                      next(null);
                    }
                  });
                  break;
                case 'list':
                  db.llen(key, function(err, reply) {
                    if (err) {
                      return next(err);
                    } else {
                      keyLength = reply;
                      next(null);
                    }
                  });
                  break;
                case 'set':
                  db.scard(key, function(err, reply) {
                    if (err) {
                      return next(err);
                    } else {
                      keyLength = reply;
                      next(null);
                    }
                  });
                  break;
                case 'zset':
                  db.zcard(key, function(err, reply) {
                    if (err) {
                      return next(err);
                    } else {
                      keyLength = reply;
                      next(null);
                    }
                  });
                  break;
                case 'hash':
                  db.hkeys(key, function(err, reply) {
                    if (err) {
                      return next(err);
                    } else {
                      keyLength = reply.length;
                      keyFields = reply;
                      next(null);
                    }
                  });
                  break;
                default:
                  next(new Error('Invalid key type: ' + keyType + '.'));
              }
            },

            // Print keys
            function(next) {
              var prefix = '';

              switch (keyType) {
                case 'string':
                  prefix = 'String';
                  break;
                case 'list':
                  prefix = 'List';
                  break;
                case 'set':
                  prefix = 'Set';
                  break;
                case 'zset':
                  prefix = 'Sorted Set';
                  break;
                case 'hash':
                  prefix = 'Hash';
                  break;
              }

              console.log(prefix + ' (length: ' + keyLength + '): ' + key + ' (TTL: ' + keyTTL + ')');

              if (keyType === 'hash' && keyFields) {
                console.log('  Fields:');

                keyFields.forEach(function (reply, index) {
                  console.log('    ' + index + ": " + reply.toString());
                });
              }

              next(null);
            }
          ], function(err) {
            return eachCallback(err);
          });
        }, function(err) {
          // Close Redis connection
          db.end();

          if (err) {
            return callback(err);
          } else {
            return callback(null, 0);
          }
        });
      }
    }
  });
};
