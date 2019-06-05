import * as util from 'util';
import * as fs from 'fs';
import * as chokidar from 'chokidar';

export enum LogLevel {
    debug = 0,
    info = 1,
    error = 2,
    silent = 3,
}

export interface ILog {
    (...args: Array<any>): void,
}

export interface IConsole {
    debug: ILog,
    info: ILog,
    error: ILog,
}

export interface IFileFinder {
    (pathname: string): Promise<{file: string, stats: fs.Stats}>,
}

export interface IOptions {
    documentRoot?: string | Array<string>,
    index?: string,
    baseDirectory?: string,
    chokidar?: chokidar.WatchOptions | null,
    logLevel?: LogLevel,
    stdout?: NodeJS.WritableStream,
    stderr?: NodeJS.WritableStream,
    inspectOptions?: util.InspectOptions,
}

export interface IFunctions {
    findFile: IFileFinder,
    watcher: chokidar.FSWatcher | null,
    console: IConsole,
}
