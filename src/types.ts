import * as fs from 'fs';
import * as stream from 'stream';
import * as chokidar from 'chokidar';
import * as connect from 'connect';

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
    logLevel: LogLevel,
}

export interface IFile {
    path: string,
    relativePath: string,
    stats: fs.Stats,
}

export interface IFileFinder {
    (pathname: string): Promise<IFile>,
    resolveDocumentRoot: (absolutePath: string) => string,
}

export interface IContentTypeGetter {
    (pathname: string): string | null,
}

export interface ISnippetInjector {
    (readable: stream.Readable): stream.Transform,
}

export interface IFunctions {
    findFile: IFileFinder,
    watcher: chokidar.FSWatcher | null,
    console: IConsole,
}

export interface IEventCompiler {
    (
        data: string,
        eventName?: string,
    ): string,
}

export interface IConnectionHandler {
    handler: connect.SimpleHandleFunction,
    sendEvent: (...args: Parameters<IEventCompiler>) => void,
}
