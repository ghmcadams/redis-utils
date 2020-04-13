'use strict';

var async = require('async');
var redis = require('redis');

module.exports = function(params, callback) {
  params = params || {};

  params.source = params.source || {};
  params.source.hostname = params.source.hostname || '127.0.0.1';
  params.source.auth = params.source.auth || '';
  params.source.port = params.source.port || 6379;
  params.source.db = params.source.db || 0;

  params.destination = params.destination || {};
  params.destination.hostname = params.destination.hostname || '127.0.0.1';
  params.destination.auth = params.destination.auth || '';
  params.destination.port = params.destination.port || 6379;
  params.destination.db = params.destination.db || 0;

  params.pattern = params.pattern || '*';
  params.overwrite = params.overwrite || false;
  params.hashOverwriteMode = params.hashOverwriteMode || 'field';


  // Connect to Redis Instances
  var sourceDb = redis.createClient(params.source.port, params.source.hostname, {
    auth_pass: params.source.auth
  });
  sourceDb.select(params.source.db);

  var destinationDb = redis.createClient(params.destination.port, params.destination.hostname, {
    auth_pass: params.destination.auth
  });
  destinationDb.select(params.destination.db);


  var result = {
    source: 0,
    moved: 0
  };

  var moveKeysByCursor = (function(keysErr, nextCursorWithKeys) {
    if (keysErr) {
      return callback(keysErr);
    } else {
      var nextCursor = nextCursorWithKeys[0];
      var keys = nextCursorWithKeys[1];
      console.log('Trying to move %d keys matching the specified pattern.', keys.length);

      if (keys.length === 0) {
        if (nextCursor == 0) {
          return callback(null, result);
        } else {
          return scanLoop(nextCursor);
        }
      } else {
        result.source += keys.length;

        async.eachSeries(keys, function(key, eachCallback) {
          var keyType = null;
          var keyValue = null;
          var keyTTL = -1;
          var keyExists = null;

          async.waterfall([
            // In parallel, get the type, ttl, and whether or not the key exists in the destination
            function(next) {
              async.parallel([
                // Get the type
                function(next) {
                  sourceDb.type(key, function(typeErr, type) {
                    if (typeErr) {
                      return next(typeErr);
                    } else {
                      keyType = type;
                      return next(null);
                    }
                  });
                },

                // Get the expiration (TTL)
                function(next) {
                  sourceDb.ttl(key, function(ttlErr, ttl) {
                    if (ttlErr) {
                      return next(ttlErr);
                    } else {
                      keyTTL = parseInt(ttl, 10);
                      return next(null);
                    }
                  });
                },

                // Check whether this key exists in the destination
                function(next) {
                  destinationDb.exists(key, function(existsErr, existsReply) {
                    if (existsErr) {
                      return next(existsErr);
                    } else {
                      keyExists = (existsReply === 1);
                      return next(null);
                    }
                  });
                }
              ],
              function(err) {
                return next(err);
              });
            },

            // Get the value (if needed)
            function(next) {
              // store the value
              var saveValue = function(valueErr, value) {
                if (valueErr) {
                  return next(valueErr);
                } else {
                  keyValue = value;
                  return next(null);
                }
              };

              // Get the value from the source
              var getValue = function() {
                console.log('Getting data for key %s from source...', key);
                switch (keyType) {
                  case 'string':
                    sourceDb.get(key, saveValue);
                    break;
                  case 'list':
                    sourceDb.lrange(key, 0, -1, saveValue);
                    break;
                  case 'set':
                    sourceDb.smembers(key, saveValue);
                    break;
                  case 'zset':
                    sourceDb.zrange(key, 0, -1, 'withscores', saveValue);
                    break;
                  case 'hash':
                    sourceDb.hgetall(key, saveValue);
                    break;
                }
              };

              // For performance reasons, we will only get the value if there's a chance we'll write it
              // to the destination.  If the key exists in destination, and overwrite is false, then
              // don't take the time to get it from the source.
              if (!keyExists) {
                getValue();
              } else {
                if (params.overwrite === true) {
                  getValue();
                } else {
                  // In the case of a hash, there may be a field that does not exist
                  // Get the values here, and decide later if we write them based on field existence
                  if (params.hashOverwriteMode === 'field' && keyType === 'hash') {
                    getValue();
                  } else {
                    console.log('Skipping key %s.', key);
                    return next(null);
                  }
                }
              }
            },

            // Write value to the destination
            function(next) {
              var writeValue = function() {
                switch (keyType) {
                  case 'string':
                    console.log('Writing string value to key %s to destination...', key);
                    destinationDb.set(key, keyValue, function(err, reply) {
                      if (err) {
                        return next(err);
                      } else {
                        sourceDb.del(key, function(err) {
                          if (err) {
                            return next(err);
                          } else {
                            result.moved++;
                            console.log('string value moved successfully.');
                            return next(null);
                          }
                        });
                      }
                    });
                    break;
                  case 'list':
                    console.log('Writing list values to key %s to destination...', key);
                    destinationDb.rpush([key].concat(keyValue), function(err, reply) {
                      if (err) {
                        return next(err);
                      } else {
                        sourceDb.del(key, function(err) {
                          if (err) {
                            return next(err);
                          } else {
                            result.moved++;
                            console.log('%d list values moved successfully.', reply);
                            return next(null);
                          }
                        });
                      }
                    });
                    break;
                  case 'set':
                    console.log('Writing set values to key %s to destination...', key);
                    destinationDb.sadd([key].concat(keyValue), function(err, reply) {
                      if (err) {
                        return next(err);
                      } else {
                        sourceDb.del(key, function(err) {
                          if (err) {
                            return next(err);
                          } else {
                            result.moved++;
                            console.log('%d set values moved successfully.', reply);
                            return next(null);
                          }
                        });
                      }
                    });
                  break;
                  case 'zset':
                    console.log('Writing sorted set values to key %s to destination...', key);
                    // The getter returns ' value, score ' - The setter uses ' score, value ' (we reverse it here)
                    var arr = [key];
                    for (var i = 0; i < keyValue.length; i = i + 2) {
                      arr.push(keyValue[i + 1]);
                      arr.push(keyValue[i]);
                    }

                    destinationDb.zadd(arr, function(err, reply) {
                      if (err) {
                        return next(err);
                      } else {
                        sourceDb.del(key, function(err) {
                          if (err) {
                            return next(err);
                          } else {
                            result.moved++;
                            console.log('%d sorted set values moved successfully.', reply);
                            return next(null);
                          }
                        });
                      }
                    });
                    break;
                  case 'hash':
                    console.log('Writing hash values to key %s to destination...', key);
                    // If overwrite is true, existing fields have been deleted by this point
                    if (params.overwrite === true) {
                      destinationDb.hmset(key, keyValue, function(err, reply) {
                        if (err) {
                          return next(err);
                        } else {
                          sourceDb.del(key, function(err) {
                            if (err) {
                              return next(err);
                            } else {
                              result.moved++;
                              console.log('%d hash field values moved successfully.', Object.keys(keyValue).length);
                              return next(null);
                            }
                          });
                        }
                      });
                    } else {
                      // If overwrite is false, only write fields that do not exist (using hsetnx)
                      var hashValuesWritten = 0;
                      async.each(Object.keys(keyValue), function(field, eachFieldCallback) {
                        destinationDb.hsetnx(key, field, keyValue[field], function(hsetnxErr, hsetnxCount) {
                          if (hsetnxErr) {
                            return eachFieldCallback(hsetnxErr);
                          } else {
                            hashValuesWritten += hsetnxCount;
                            return eachFieldCallback(null, hsetnxCount);
                          }
                        });
                      },
                      function(err) {
                        if (err) {
                          return next(err);
                        } else {
                          sourceDb.del(key, function(err) {
                            if (err) {
                              return next(err);
                            } else {
                              if (hashValuesWritten === 0) {
                                console.log('0 hash field values moved.');
                              } else {
                                result.moved++;
                                console.log('%d of %d hash field values moved successfully.', hashValuesWritten, Object.keys(keyValue).length);
                              }
                              return next(null);
                            }
                          });
                        }
                      });
                    }
                    break;
                }
              };

              // If the key does not exist, then simply write the value
              if (!keyExists) {
                writeValue();
              } else {
                // if the key exists and overwrite is true, write the value after deleting existing key
                // if the key exists but overwrite is false, do not write value
                if (keyType === 'hash') {
                  if (params.overwrite === true) {
                    if (params.hashOverwriteMode === 'field') {
                      async.each(Object.keys(keyValue), function(field, eachFieldCallback) {
                        destinationDb.hdel(key, field, function(delFieldErr, delFieldReply) {
                          if (delFieldErr) {
                            return eachFieldCallback(delFieldErr);
                          } else {
                            return eachFieldCallback(null, delFieldReply);
                          }
                        });
                      },
                      function(err) {
                        if (err) {
                          return next(err);
                        } else {
                          writeValue();
                        }
                      });
                    } else {
                      destinationDb.del(key, function(delKeyErr, delKeyReply) {
                        if (delKeyErr) {
                          return next(delKeyErr);
                        } else {
                          writeValue();
                        }
                      });
                    }
                  } else {
                    if (params.hashOverwriteMode === 'field') {
                      writeValue();
                    } else {
                      return next(null);
                    }
                  }
                } else {
                  if (params.overwrite === true) {
                    return destinationDb.del(key, function(delKeyErr, delKeyReply) {
                      if (delKeyErr) {
                        return next(delKeyErr);
                      } else {
                        writeValue();
                      }
                    });
                  } else {
                    return next(null);
                  }
                }
              }
            },

            // Add expiration (ONLY if the key did not exist before, and ttl existed in the source)
            function(next) {
              if (!keyExists && !isNaN(keyTTL) && keyTTL !== -1) {
                destinationDb.expire(key, keyTTL, next);
              } else {
                return next(null);
              }
            }
          ], function(err) {
            return eachCallback(err);
          });
        }, function(err) {
          if (nextCursor == 0) {
            // Close Redis connections
            sourceDb.end();
            destinationDb.end();
          }

          if (err) {
            return callback(err);
          } else {
            if (nextCursor == 0) {
              return callback(null, result);
            } else {
              return scanLoop(nextCursor);
            }
          }
        });
      }
    }
  });

  var scanLoop = (function(nextCursor) {
    sourceDb.scan(nextCursor, "match", params.pattern, "count", params.pageSize, moveKeysByCursor);
  });
  
  scanLoop(0);

};