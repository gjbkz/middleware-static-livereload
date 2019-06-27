import * as fs from 'fs';
import * as stream from 'stream';
import * as http from 'http';
import * as util from 'util';
import * as chokidar from 'chokidar';

export enum LogLevel {
    debug = 0,
    info = 1,
    error = 2,
    silent = 3,
}

export interface ILog {
    end: () => void,
    (...args: Array<any>): void,
}

export interface IConsole {
    debug: ILog,
    info: ILog,
    error: ILog,
    logLevel: LogLevel,
    end: () => void,
}

export interface IFile {
    path: string,
    relativePath: string,
    stats: fs.Stats,
}

export interface IFileFinder {
    documentRoots: Array<string>,
    isReserved: (file: string) => boolean,
    (pathname: string): Promise<IFile>,
}

export interface IContentTypeGetter {
    (pathname: string): string | null,
}

export interface ISnippetInjector {
    size: number,
    (readable: stream.Readable): stream.Transform,
}

export interface IEventCompiler {
    (data: string, eventName?: string): string,
}

export interface ISendEvent {
    (...args: Parameters<IEventCompiler>): void,
}

export interface IConnectionHandler {
    sendEvent: ISendEvent,
    (req: http.IncomingMessage, res: http.ServerResponse): void,
}

export interface IOptions {
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
    encoding?: BufferEncoding,
    inspectOptions?: util.InspectOptions,
}

export interface IEvent {
    [key: string]: string,
}
