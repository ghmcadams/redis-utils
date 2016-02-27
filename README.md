Redis Utilities
===============

A Node.js based command line interface (CLI) for performing pattern based Redis functions

## Installation

    $ npm install redis-utils-cli -g


## Commands

**Copy**  
Copy keys from one Redis instance to another

**Arguments**

 - \<source\>       The address for the source Redis database (follows this format: [auth@]\<hostname\>[:port][/db] )
 - \<destination\>  The address for the destination Redis database (follows this format: [auth@]\<hostname\>[:port][/db] )

**Options include**

 - -p \<pattern\> (Key pattern. Default: *)
 - -o           (Overwrite. Default (when omitted): false)
 - -m \<mode\>    (Hash overwrite mode (key|field). Default: key)

---

**Delete**  
Delete keys from a Redis instance.

**Arguments**

 - \<redis\>    The address for the Redis database (follows this format: [auth@]\<hostname\>[:port][/db] )
 - \<pattern\>  The key pattern. (Default: *)

---

**List**  
List all keys and hash fields that match a specified pattern.

**Arguments**

 - \<redis\>    The address for the Redis database (follows this format: [auth@]\<hostname\>[:port][/db] )
 - \<pattern\>  The key pattern. (Default: *)

---

**Count**  
Display a numeric count of all keys that match a specified pattern.

**Arguments**

 - \<redis\>    The address for the Redis database (follows this format: [auth@]\<hostname\>[:port][/db] )
 - \<pattern\>  The key pattern. (Default: *)


## Supported Glob-Style Patterns

 - `h?llo` matches hello, hallo and hxllo
 - `h*llo` matches hllo and heeeello
 - `h[ae]llo` matches hello and hallo, but not hillo
 - `h[^e]llo` matches hallo, hbllo, ... but not hello
 - `h[a-b]llo` matches hallo and hbllo

Use \ to escape special characters if you want to match them verbatim.

(basically, what you are already familiar with using Redis)

## Examples

    $ redis-utils copy someauth@10.2.1.44/0 127.0.0.1/0 -p users:*

Copies all keys matching the pattern `users:*` from `10.2.1.44, db: 0` into `127.0.0.1, db: 0`  
(Because `-o` was not included, it would only copy data if the keys do not exist in destination)

For hashes, if you want to copy data based on the existence of hash fields instead of keys, use the `-m field` option. 

<br>

    $ redis-utils del 127.0.0.1 users:*

Deletes all keys matching the pattern `users:*` from `127.0.0.1, db: 0`

<br>


    $ redis-utils list 127.0.0.1 users:*

Displays in the terminal, all keys (with some additional details) matching the pattern `users:*` from `127.0.0.1, db: 0`

<br>


    $ redis-utils count 127.0.0.1 users:*

Displays in the terminal, a numeric count of all keys matching the pattern `users:*` from `127.0.0.1, db: 0`

<br>


## IMPORTANT NOTE

It is important to note that these commands use the Redis command `keys` and
by their recommendation, should be used only in production environments with extreme
care as it may ruin performance when executed against large databases.

Read the [Redis Documentation](http://redis.io/commands/keys) for more information.

## License

(The MIT License)

Copyright (c) 2016 Gabriel McAdams &lt;ghmcadams@yahoo.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
