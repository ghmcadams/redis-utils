#!/usr/bin/env node

'use strict';

var program = require('commander');
var util = require('./util');
var copy = require('./commands/copy');
var del = require('./commands/del');
var count = require('./commands/count');
var list = require('./commands/list');
var move = require('./commands/move');


program
  .version('0.0.1')
  .description('Redis utility functions')
  .usage('<command> ...');


// Copy function
program
  .command('copy <source> <destination>')
  .description('Copy data from one Redis instance to another')
  .usage('<source> <destination> [options]')

  .option('-p, --pattern <p>', 'The pattern with which to filter keys', '*')
  .option('-o, --overwrite', 'Overwrite existing keys')
  .option('-m, --hashOverwriteMode <mode>', 'Overwrite mode for hash keys (field or key)', /^(field|key)$/i, 'key')

  .on('--help', function() {
    console.log();
    console.log('  Arguments:');
    console.log();
    console.log('    source        The source Redis instance to copy from (EX: auth@10.1.1.14:6379/1 )');
    console.log('    destination   The destination Redis instance to copy to (EX: 127.0.0.1:6379/0 )');
    console.log('         Both follow this format:');
    console.log('            [auth@]<hostname>[:port][/db]');
    console.log('               auth: not required.');
    console.log('               port: defaults to 6379.');
    console.log('               db: defaults to 0.');
    console.log();
    console.log('  Examples:');
    console.log();
    console.log('    $ copy myauth@10.1.1.4/0 127.0.0.1/0');
    console.log('    $ copy myauth@10.1.1.4/0 127.0.0.1/0 -o -m key -p user:55d54:*');
    console.log();
  })

  .action(function(source, destination, options) {
    // Process arguments
    source = util.parseRedisAddress(source);
    destination = util.parseRedisAddress(destination);
    options.pattern = options.pattern || '*';

    // Disallow source being equal to destination
    if (source.hostname == destination.hostname &&
      source.port == destination.port &&
      source.db == destination.db) {

      console.error();
      console.error("  error: Source and destination cannot be equal.");
      console.error();
      process.exit(1);
    }

    var message = [
      'Copying data from:',
      '    ' + source.hostname + ':' + source.port + ' (DB: ' + source.db + ')',
      'to:',
      '    ' + destination.hostname + ':' + destination.port + ' (DB: ' + destination.db + ')',
      '',
      'using key pattern:',
      '    ' + options.pattern + '',
      '',
      'overwrite settings:',
      '    Overwrite: ' + ((!!options.overwrite).toString().toLowerCase()),
      '    Hash Overwrite Mode: ' + options.hashOverwriteMode,
      ''
    ];

    console.log(message.join('\n'));

    var params = {
      source: source,
      destination: destination,
      pattern: options.pattern,
      overwrite: options.overwrite,
      hashOverwriteMode: options.hashOverwriteMode
    };

    copy(params, function(err, result) {
      if (err) {
        console.error((err.message || err) + '\n');
        process.exit(1);
      } else {
        console.log('Copy complete. Copied ' + result.written + ' of ' + result.source + ' keys.\n');
        process.exit(0);
      }
    });
  });


// Delete function
program
  .command('delete <redis> [pattern]')
  .alias('del')
  .description('Delete keys matching a specified pattern from a Redis instance')
  .usage('<redis> [pattern]')

  .on('--help', function() {
    console.log();
    console.log('  Arguments:');
    console.log();
    console.log('    redis     The Redis instance to delete from (EX: auth@10.1.1.14:6379/1 )');
    console.log('         Follows this format:');
    console.log('            [auth@]<hostname>[:port][/db]');
    console.log('               auth: not required.');
    console.log('               port: defaults to 6379.');
    console.log('               db: defaults to 0.');
    console.log('    pattern   The pattern with which to filter keys (default: *)');
    console.log();
    console.log('  Examples:');
    console.log();
    console.log('    $ del myauth@10.1.1.4/0 user:*');
    console.log('    $ del localhost:6379/1');
    console.log();
  })

  .action(function(redis, pattern) {
    // Process arguments
    redis = util.parseRedisAddress(redis);
    pattern = pattern || '*';

    // Describe to the user what will occur
    var message = [
      'Deleting keys from:',
      '    ' + redis.hostname + ':' + redis.port + ' (DB: ' + redis.db + ')',
      '',
      'using key pattern:',
      '    ' + pattern + '',
      ''
    ];

    console.log(message.join('\n'));

    // Perform the action
    del(redis, pattern, function(err, result) {
      if (err) {
        console.error((err.message || err) + '\n');
        process.exit(1);
      } else {
        console.log('Delete complete. Deleted ' + result + ' keys.\n');
        process.exit(0);
      }
    });
  });


// Count function
program
  .command('count <redis> [pattern]')
  .description('Count keys matching a specified pattern from a Redis instance')
  .usage('<redis> [pattern]')

  .on('--help', function() {
    console.log();
    console.log('  Arguments:');
    console.log();
    console.log('    redis     The Redis instance to delete from (EX: auth@10.1.1.14:6379/1 )');
    console.log('         Follows this format:');
    console.log('            [auth@]<hostname>[:port][/db]');
    console.log('               auth: not required.');
    console.log('               port: defaults to 6379.');
    console.log('               db: defaults to 0.');
    console.log('    pattern   The pattern with which to filter keys (default: *)');
    console.log();
    console.log('  Examples:');
    console.log();
    console.log('    $ count myauth@10.1.1.4/0 user:*');
    console.log('    $ count localhost:6379/1');
    console.log();
  })

  .action(function(redis, pattern) {
    // Process arguments
    redis = util.parseRedisAddress(redis);
    pattern = pattern || '*';

    // Describe to the user what will occur
    var message = [
      'Counting keys from:',
      '    ' + redis.hostname + ':' + redis.port + ' (DB: ' + redis.db + ')',
      '',
      'using key pattern:',
      '    ' + pattern + '',
      ''
    ];

    console.log(message.join('\n'));

    // Perform the action
    count(redis, pattern, function(err, result) {
      if (err) {
        console.error((err.message || err) + '\n');
        process.exit(1);
      } else {
        process.exit(0);
      }
    });
  });


// List function
program
  .command('list <redis> [pattern]')
  .description('List keys matching a specified pattern from a Redis instance')
  .usage('<redis> [pattern]')

  .on('--help', function() {
    console.log();
    console.log('  Arguments:');
    console.log();
    console.log('    redis     The Redis instance to delete from (EX: auth@10.1.1.14:6379/1 )');
    console.log('         Follows this format:');
    console.log('            [auth@]<hostname>[:port][/db]');
    console.log('               auth: not required.');
    console.log('               port: defaults to 6379.');
    console.log('               db: defaults to 0.');
    console.log('    pattern   The pattern with which to filter keys (default: *)');
    console.log();
    console.log('  Examples:');
    console.log();
    console.log('    $ list myauth@10.1.1.4/0 user:*');
    console.log('    $ list localhost:6379/1');
    console.log();
  })

  .action(function(redis, pattern) {
    // Process arguments
    redis = util.parseRedisAddress(redis);
    pattern = pattern || '*';

    // Describe to the user what will occur
    var message = [
      'Displaying keys from:',
      '    ' + redis.hostname + ':' + redis.port + ' (DB: ' + redis.db + ')',
      '',
      'using key pattern:',
      '    ' + pattern + '',
      ''
    ];

    console.log(message.join('\n'));

    // Perform the action
    list(redis, pattern, function(err, result) {
      if (err) {
        console.error((err.message || err) + '\n');
        process.exit(1);
      } else {
        process.exit(0);
      }
    });
  });

// Move function
program
  .command('move <source> <destination>')
  .description('Move data from one Redis instance to another')
  .usage('<source> <destination> [options]')

  .option('-p, --pattern <p>', 'The pattern with which to filter keys', '*')
  .option('-o, --overwrite', 'Overwrite existing keys')
  .option('-m, --hashOverwriteMode <mode>', 'Overwrite mode for hash keys (field or key)', /^(field|key)$/i, 'key')
  .option('-s, --pageSize <size>', 'The page size to use when scanning keys', 1000)

  .on('--help', function() {
    console.log();
    console.log('  Arguments:');
    console.log();
    console.log('    source        The source Redis instance to move from (EX: auth@10.1.1.14:6379/1 )');
    console.log('    destination   The destination Redis instance to move to (EX: 127.0.0.1:6379/0 )');
    console.log('         Both follow this format:');
    console.log('            [auth@]<hostname>[:port][/db]');
    console.log('               auth: not required.');
    console.log('               port: defaults to 6379.');
    console.log('               db: defaults to 0.');
    console.log();
    console.log('  Examples:');
    console.log();
    console.log('    $ move myauth@10.1.1.4/0 127.0.0.1/0');
    console.log('    $ move myauth@10.1.1.4/0 127.0.0.1/0 -o -m key -p user:55d54:*');
    console.log();
  })

  .action(function(source, destination, options) {
    // Process arguments
    source = util.parseRedisAddress(source);
    destination = util.parseRedisAddress(destination);
    options.pattern = options.pattern || '*';

    // Disallow source being equal to destination
    if (source.hostname == destination.hostname &&
      source.port == destination.port &&
      source.db == destination.db) {

      console.error();
      console.error("  error: Source and destination cannot be equal.");
      console.error();
      process.exit(1);
    }

    var message = [
      'Moving data from:',
      '    ' + source.hostname + ':' + source.port + ' (DB: ' + source.db + ')',
      'to:',
      '    ' + destination.hostname + ':' + destination.port + ' (DB: ' + destination.db + ')',
      '',
      'using key pattern:',
      '    ' + options.pattern + '',
      'with page size:',
      '    ' + options.pageSize + '',
      '',
      'overwrite settings:',
      '    Overwrite: ' + ((!!options.overwrite).toString().toLowerCase()),
      '    Hash Overwrite Mode: ' + options.hashOverwriteMode,
      ''
    ];

    console.log(message.join('\n'));

    var params = {
      source: source,
      destination: destination,
      pattern: options.pattern,
      overwrite: options.overwrite,
      hashOverwriteMode: options.hashOverwriteMode,
      pageSize: options.pageSize
    };

    move(params, function(err, result) {
      if (err) {
        console.error((err.message || err) + '\n');
        process.exit(1);
      } else {
        console.log('Move complete. Moved ' + result.moved + ' of ' + result.source + ' keys.\n');
        process.exit(0);
      }
    });
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help();
}

//TODO: If a command was specified that doesn't exist, display help and exit
