'use strict';

module.exports = {
  parseRedisAddress : function parseRedisAddress(address) {
    var url = {
      auth: '',
      hostname: '',
      port: 6379,
      db: 0
    };

    var check = address;
    // check: [auth@]<hostname>[:port][/db]

    // Check the last part for a db number
    var matches = check.match(/\/(\d+)$/);
    if (matches) {
      url.db = Number(matches[1]);
      check = check.slice(0, check.length - matches[0].length);
    } else {
      var newMatches = check.match(/(\/.+)$/);
      if (newMatches) {
        check = check.slice(0, check.length - matches[0].length);
      }
    }

    // check: [auth@]<hostname>[:port]

    // Check the first part for the auth
    var atPosition = check.lastIndexOf('@');
    if (atPosition > 0) {
      url.auth = check.substring(0, atPosition);
      check = check.slice(atPosition + 1);
    }

    // check: <hostname>[:port]

    // Split the rest for hostname and port
    var parts = check.split(':');
    url.hostname = parts[0];

    if (parts.length > 1) {
      var port = Number(parts[1]);
      if (!isNaN(port)) {
        url.port = port;
      }
    }

    return url;
  }
};
