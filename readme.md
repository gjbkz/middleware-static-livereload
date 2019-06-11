# middleware-static-livereload

[![CircleCI](https://circleci.com/gh/kei-ito/middleware-static-livereload.svg?style=svg)](https://circleci.com/gh/kei-ito/middleware-static-livereload)
[![Build Status](https://travis-ci.com/kei-ito/middleware-static-livereload.svg?branch=master)](https://travis-ci.com/kei-ito/middleware-static-livereload)
[![Build status](https://ci.appveyor.com/api/projects/status/github/kei-ito/middleware-static-livereload?branch=master&svg=true)](https://ci.appveyor.com/project/kei-ito/middleware-static-livereload/branch/master)
[![codecov](https://codecov.io/gh/kei-ito/middleware-static-livereload/branch/master/graph/badge.svg)](https://codecov.io/gh/kei-ito/middleware-static-livereload)
[![BrowserStack Status](https://www.browserstack.com/automate/badge.svg?badge_key=RThwZG1nRWNGOFFOQjc5TFJJTGovbFNJVmVmTUZxSU8zVG9MWjBnMlpiOD0tLWFHNlkrZ3JHd0FmVCtVL3k1TU1NcVE9PQ==--13129bc5044f47c05b3068e5a810a374d2dda6aa)](https://www.browserstack.com/automate/public-build/RThwZG1nRWNGOFFOQjc5TFJJTGovbFNJVmVmTUZxSU8zVG9MWjBnMlpiOD0tLWFHNlkrZ3JHd0FmVCtVL3k1TU1NcVE9PQ==--13129bc5044f47c05b3068e5a810a374d2dda6aa)

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

### documentRoot

type: `string|Array<string>`
default: `process.cwd()`

Directories which contains the files to be served.
If it is an array, it is processed as following pseudo code:

```
FOREACH documentRoot in the array
  IF documentRoot has a file at requestedPath
    RETURN the file
RETURN 404
```

### watch

type: `chokidar.FSWatcher|chokidar.WatchOptions|boolean|null`
default: `{ignoreInitial:false, useFsEvents:false})`

If it is `false` or `null`, the middleware doesn't watch files.
Otherwise, the middleware watches the served files and send events to connected clients when they are updated.
If you need to handle the watcher, you can use the watcher object itself.

### index

type: `string`
default: `index.html`

If this value is `foo.txt`, the middleware respond `/foo.txt` to `GET /`, `/foo/foo.txt` to `GET /foo/`.

### contentTypes

type: `{[contentType: string]: Array<string>}`
default: See [src/defaultContentTypes.ts](src/defaultContentTypes.ts).

A map from Content-Type to an array of file extensions.
If you given a map, it extends the default value.

### stdout, stderr

type: [NodeJS.Writable]
default: [process.stdout], [process.stderr]

Streams where the middleware writes message to.

### logLevel

type: 0 | 1 | 2 | 3
default: `1`

0: debug, 1: info, 2: error, 3: silent

### scriptPath

type: `string`
default: `middleware-static-livereload.js`

A pathname for the script enables live reloading.
If it conflicts with other middlewares, change this value.

## LICENSE

The middleware-static-livereload project is licensed under the terms of the Apache 2.0 License.

[NodeJS.Writable]: https://nodejs.org/api/stream.html#stream_class_stream_writable
[process.stdout]: https://nodejs.org/api/process.html#process_process_stdout
[process.stderr]: https://nodejs.org/api/process.html#process_process_stderr
[util.InspectOptions]: https://nodejs.org/api/util.html#util_util_inspect_object_options
