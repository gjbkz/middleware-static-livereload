import * as chokidar from 'chokidar';
import {IOptions, LogLevel, IFunctions} from './types';
import {createConsole} from './createConsole';
import {createFileFinder} from './createFileFinder';

export const getFunctions = (
    options: IOptions = {},
): IFunctions => {
    return {
        findFile: createFileFinder(
            options.documentRoot || process.cwd(),
            options.index || 'index.html',
            options.baseDirectory || process.cwd(),
        ),
        watcher: options.chokidar === null ? null : chokidar.watch([], {
            ...options.chokidar,
        }),
        console: createConsole({
            logLevel: LogLevel.info,
            stdout: options.stdout || process.stdout,
            stderr: options.stderr || process.stderr,
            inspectOptions: {
                colors: true,
                ...options.inspectOptions,
            },
        }),
    };
};
