import * as chokidar from 'chokidar';
import * as path from 'path';
import {ISendEvent, IConsole} from './types';

export const createWatcher = (
    options: {
        chokidar: chokidar.WatchOptions,
        console: IConsole,
        sendEvent: ISendEvent,
        documentRoots: Array<string>,
    },
): chokidar.FSWatcher | null => {
    const {console, sendEvent, documentRoots} = options;
    return options.chokidar === null ? null : chokidar.watch([], options.chokidar)
    .on('all', (eventName, file) => {
        console.debug(`${eventName}: ${file}`);
        const documentRoot = documentRoots.find((documentRoot) => file.startsWith(documentRoot));
        if (!documentRoot) {
            throw new Error('Cannot find a documentRoot');
        }
        sendEvent(
            path.relative(documentRoot, file).split(path.sep).join('/'),
            eventName,
        );
    });
};
