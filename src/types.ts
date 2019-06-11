import * as fs from 'fs';
import * as stream from 'stream';
import * as http from 'http';
import {compileContentTypes} from './compileContentTypes';
import {createSnippetInjector} from './createSnippetInjector';
import {createFileFinder} from './createFileFinder';
import {createConsole} from './createConsole';
import {createFileWatcher} from './createFileWatcher';

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

export type IOptions = {
    scriptPrefix?: string,
    contentTypes?: Parameters<typeof compileContentTypes>[0],
}
& Parameters<typeof createFileWatcher>[0]
& Parameters<typeof createSnippetInjector>[0]
& Parameters<typeof createFileFinder>[0]
& Parameters<typeof createConsole>[0];

export interface IEvent {
    [key: string]: string,
}
