# middleware-static-livereload

A middleware for [connect](https://github.com/senchalabs/connect) servers.
It injects a live-reload script into `text/html` files before serving them.

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

```typescript
middleware(options?: Partial<MiddlewareOptions>)

interface MiddlewareOptions {
  /**
    * Directories that contain files to be served.
    * If it is an array, it is processed according to the following pseudocode:
    *   FOREACH documentRoot in the array
    *     IF documentRoot has a file at requestedPath
    *       RETURN the file
    *   RETURN 404
    * @default process.cwd()
    */
  documentRoot: PathLike | Array<PathLike>,
  /**
    * The base directory where the middleware resolves `documentRoot`.
    * @default process.cwd()
    */
  baseDir: string,
  /**
    * If it is `false` or `null`, the middleware doesn't watch files.
    * Otherwise, the middleware watches served files and sends events
    * to connected clients when they are updated.
    * If you need to do something with the watcher outside this middleware,
    * you can pass the watcher object itself.
    * @default { ignoreInitial: false }
    */
  watch: ChokidarOptions | FSWatcher | boolean | null,
  /**
    * If this value is `foo.txt`, the middleware responds `/foo.txt` to `GET /`,
    * `/foo/foo.txt` to `GET /foo/`.
    * @default 'index.html'
    */
  index: string,
  /**
    * A map from Content-Type to an array of file extensions.
    * If you provide a map, it replaces the default map.
    * @default See src/middleware.ts defaultOptions.contentTypes
    */
  contentTypes: Record<string, Array<string>>,
  /**
    * 0: debug, 1: info, 2: error, 3: silent
    * @default 1
    */
  logLevel: LogLevel,
  /**
    * Streams where the middleware writes messages to.
    * @default process.stdout
    */
  stdout: Writable,
  /**
    * Streams where the middleware writes messages to.
    * @default process.stderr
    */
  stderr: Writable,
  /**
    * A pattern or patterns to detect the position before which a <script> tag
    * is inserted.
    * If this value is `x` and the document is `abc x def`, then the actual
    * response will be `abc <script src="..."></script>x def`.
    * @default [/<\/head/i, /<\/body/i, /<meta/i, /<title/i, /<script/i, /<link/i]
    */
  insertBefore: string | RegExp | Array<string | RegExp>,
  /**
    * A pattern or patterns to detect the position after which a <script> tag
    * is inserted.
    * If this value is `x` and the document is `abc x def`, then the actual
    * response will be `abc x<script src="..."></script> def`.
    * @default [/<!doctype\s*html\s*>/i]
    */
  insertAfter: string | RegExp | Array<string | RegExp>,
  /**
    * The pathname of the script that enables live reloading.
    * If the default value conflicts with other middlewares, change this value.
    * @default 'middleware-static-livereload.js'
    */
  scriptPath: string,
  /**
    * Character encoding used when injecting the script.
    * @default 'utf-8'
    */
  encoding: BufferEncoding,
  /**
    * Options passed to util.inspect for logs.
    * @default { colors: true, breakLength: 40 }
    */
  inspectOptions: InspectOptions,
  /**
    * Enables file operations (upload / delete) on directory listing pages.
    * - `false` (default): disabled — listing is read-only
    * - `true`: all operations enabled
    * - object: enable individual operations
    * @default false
    */
  fileOperations: boolean | {
    /** Allow uploading files via the directory listing page. @default false */
    allowFileUpload?: boolean,
    /** Allow deleting files via the directory listing page. @default false */
    allowDelete?: boolean,
    /** Allow creating text files via the directory listing page. @default false */
    allowTextUpload?: boolean,
  },
}
```

## LICENSE

The middleware-static-livereload project is licensed under the terms of the Apache 2.0 License.

[Writable]: https://nodejs.org/api/stream.html#class-streamwritable
[process.stdout]: https://nodejs.org/api/process.html#process_process_stdout
[process.stderr]: https://nodejs.org/api/process.html#process_process_stderr
[InspectOptions]: https://nodejs.org/api/util.html#utilinspectobject-options
