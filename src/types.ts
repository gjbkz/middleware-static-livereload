import type * as fs from 'fs';
import type * as stream from 'stream';
import type * as http from 'http';
import type * as util from 'util';
import type * as chokidar from 'chokidar';
import type {LogLevel} from './LogLevel';

export interface ConsoleLike {
    debug: (...args: Array<unknown>) => void,
    info: (...args: Array<unknown>) => void,
    error: (...args: Array<unknown>) => void,
    logLevel: LogLevel,
    stdout: stream.Writable,
    stderr: stream.Writable,
}

export interface FileInfo {
    path: string,
    relativePath: string,
    stats: fs.Stats,
}

export interface ServerResponseLike {
    end: http.ServerResponse['end'],
    statusCode?: http.ServerResponse['statusCode'],
    headersSent?: http.ServerResponse['headersSent'],
    writableEnded?: http.ServerResponse['writableEnded'],
}

export interface Options {
    /**
     * Directories which contains the files to be served.
     * If it is an array, it is processed as following pseudo code:
     *   FOREACH documentRoot in the array
     *     IF documentRoot has a file at requestedPath
     *       RETURN the file
     *   RETURN 404
     * @default process.cwd()
     */
    documentRoot?: Array<string> | string,
    /**
     * If it is `false` or `null`, the middleware doesn't watch files.
     * Otherwise, the middleware watches the served files and send events
     * to connected clients when they are updated.
     * If you need to do something with the watcher outside this middleware,
     * you can pass the watcher object itself.
     * @default {ignoreInitial:false, useFsEvents:false}
     */
    watch?: chokidar.FSWatcher | chokidar.WatchOptions | boolean | null,
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
    contentTypes?: Record<string, Array<string> | string>,
    /**
     * 0: debug, 1: info, 2: error, 3: silent
     * @default 1
     */
    logLevel?: LogLevel,
    /**
     * Streams where the middleware writes message to.
     * @default process.stdout
     */
    stdout?: stream.Writable,
    /**
     * Streams where the middleware writes message to.
     * @default process.stderr
     */
    stderr?: stream.Writable,
    /**
     * A pattern or patterns to detect the position before which a <script> tag
     * is inserted.
     * If this value is `x` and the document is `abc x def`, then the actual
     * response will be `abc <script src="..."></script>x def`.
     * @default [/<\/head/i, /<\/body/i, /<meta/i, /<title/i, /<script/i, /<link/i]
     */
    insertBefore?: Array<RegExp | string> | RegExp | string,
    /**
     * A pattern or patterns to detect the position after which a <script> tag
     * is inserted.
     * If this value is `x` and the document is `abc x def`, then the actual
     * response will be `abc x<script src="..."></script> def`.
     * @default [/<!doctype\s*html\s*>/i]
     */
    insertAfter?: Array<RegExp | string> | RegExp | string,
    /**
     * A pathname for the script enables live reloading.
     * If the default value conflicts with other middlewares, change this value.
     * @default 'middleware-static-livereload.js'
     */
    scriptPath?: string,
    // eslint-disable-next-line no-undef
    encoding?: BufferEncoding,
    inspectOptions?: util.InspectOptions,
}
