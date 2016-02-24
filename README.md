redis-utils
============

A Node.js command line interface (CLI) for performing pattern based Redis functions

## Installation

    $ npm install redis-utils-cli -g

## Usage

To copy all keys matching the pattern 'users:*'

    $ redis-utils copy <source> <destination> -p users:*

Arguments:

    <source>       The address for the source Redis database (follows this format: [auth@]<hostname>[:port][/db] )
    <destination>  The address for the destination Redis database (follows this format: [auth@]<hostname>[:port][/db] )

Options include:

    -p <pattern> (Key pattern. Default: *)
    -o           (Overwrite. Default: *)
    -m <mode>    (Hash overwrite mode (key|field). Default: key)


To delete all keys matching the pattern 'users:*'

    $ redis-utils del <redis> users:*

Arguments:

    <redis>    The address for the Redis database (follows this format: [auth@]<hostname>[:port][/db] )
    <pattern>  The key pattern. (Default: *)


To count all keys matching the pattern 'users:*'

    $ redis-utils count <redis> users:*

Arguments:

    <redis>    The address for the Redis database (follows this format: [auth@]<hostname>[:port][/db] )
    <pattern>  The key pattern. (Default: *)


To list all keys matching the pattern 'users:*'

    $ redis-utils list <redis> users:*

Arguments:

    <redis>    The address for the Redis database (follows this format: [auth@]<hostname>[:port][/db] )
    <pattern>  The key pattern. (Default: *)

	

## IMPORTANT NOTE

It is important to note that these commands use the Redis command `keys` and
by their recommendation, should be used only in production environments with extreme
care as it may ruin performance when executed against large databases.

See http://redis.io/commands/keys for more information.

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
