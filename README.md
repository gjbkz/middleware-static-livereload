# middleware-static-livereload

![Test](https://github.com/kei-ito/middleware-static-livereload/workflows/Test/badge.svg)
[![codecov](https://codecov.io/gh/kei-ito/middleware-static-livereload/branch/master/graph/badge.svg)](https://codecov.io/gh/kei-ito/middleware-static-livereload)
[![BrowserStack Status](https://automate.browserstack.com/badge.svg?badge_key=cll6bnJraU9ROGpHdWZYR3J6VzZid3lwSGE0a2REaXd2eWk0Y1dDd1NsUT0tLXNHQjRueFRqcU9YQUc2TndUd05UN1E9PQ==--db592e073086b93668e627615526e58bc499fde2)](https://automate.browserstack.com/public-build/cll6bnJraU9ROGpHdWZYR3J6VzZid3lwSGE0a2REaXd2eWk0Y1dDd1NsUT0tLXNHQjRueFRqcU9YQUc2TndUd05UN1E9PQ==--db592e073086b93668e627615526e58bc499fde2)


A middleware for [connect](https://github.com/senchalabs/connect) server.
It injects the autoreload script into text/html files before serving them.

## Install

```
npm install middleware-static-livereload
```

## Usage

```javascript
const http = require('http');
const connect = require('connect');
const app = connect();
app.use(require('middleware-static-livereload').middleware());
const server = http.createServer(app).listen(3000);
```

## Options

```javascript
{
  /**
    * Directories which contains the files to be served.
    * If it is an array, it is processed as following pseudo code:
    *   FOREACH documentRoot in the array
    *     IF documentRoot has a file at requestedPath
    *       RETURN the file
    *   RETURN 404
    * @default process.cwd()
    */
  documentRoot?: string | Array<string>,
  /**
    * If it is `false` or `null`, the middleware doesn't watch files.
    * Otherwise, the middleware watches the served files and send events
    * to connected clients when they are updated.
    * If you need to do something with the watcher outside this middleware,
    * you can pass the watcher object itself.
    * @default {ignoreInitial:false, useFsEvents:false}
    */
  watch?: chokidar.WatchOptions | chokidar.FSWatcher | boolean | null,
  /**
    * If this value is `foo.txt`, the middleware respond `/foo.txt` to `GET /`,
    * `/foo/foo.txt` to `GET /foo/`.
    * @default 'index.html'
    */
  index?: string,
  /**
    * A map from Content-Type to an array of file extensions.
    * If you given a map, it extends the default map.
    * @default See [src/defaultContentTypes.ts](src/defaultContentTypes.ts).
    */
  contentTypes?: {
      [type: string]: string | Array<string>,
  },
  /**
    * 0: debug, 1: info, 2: error, 3: silent
    * @default 1
    */
  logLevel?: LogLevel,
  /**
    * Streams where the middleware writes message to.
    * @default process.stdout
    */
  stdout?: NodeJS.WritableStream,
  /**
    * Streams where the middleware writes message to.
    * @default process.stderr
    */
  stderr?: NodeJS.WritableStream,
  /**
    * A pattern or patterns to detect the position before which a <script> tag
    * is inserted.
    * If this value is `x` and the document is `abc x def`, then the actual
    * response will be `abc <script src="..."></script>x def`.
    * @default [/<\/head/i, /<\/body/i, /<meta/i, /<title/i, /<script/i, /<link/i]
    */
  insertBefore?: string | RegExp | Array<string | RegExp>,
  /**
    * A pattern or patterns to detect the position after which a <script> tag
    * is inserted.
    * If this value is `x` and the document is `abc x def`, then the actual
    * response will be `abc x<script src="..."></script> def`.
    * @default [/<!doctype\s*html\s*>/i]
    */
  insertAfter?: string | RegExp | Array<string | RegExp>,
  /**
    * A pathname for the script enables live reloading.
    * If the default value conflicts with other middlewares, change this value.
    * @default 'middleware-static-livereload.js'
    */
  scriptPath?: string,
}
```

## LICENSE

The middleware-static-livereload project is licensed under the terms of the Apache 2.0 License.

[NodeJS.Writable]: https://nodejs.org/api/stream.html#stream_class_stream_writable
[process.stdout]: https://nodejs.org/api/process.html#process_process_stdout
[process.stderr]: https://nodejs.org/api/process.html#process_process_stderr
[util.InspectOptions]: https://nodejs.org/api/util.html#util_util_inspect_object_options
