import * as chokidar from 'chokidar';
import type {IOptions} from './types';

const isFSWatcher = (
    x: chokidar.FSWatcher | chokidar.WatchOptions | boolean | undefined,
): x is chokidar.FSWatcher => typeof x === 'object'
&& 'add' in x
&& typeof x.add === 'function'
&& 'unwatch' in x
&& typeof x.unwatch === 'function';

export const createFileWatcher = (
    {watch}: IOptions,
): chokidar.FSWatcher | null => {
    if (watch === false || watch === null) {
        return null;
    }
    if (isFSWatcher(watch)) {
        return watch;
    }
    return chokidar.watch([], {
        useFsEvents: false,
        ignoreInitial: false,
        awaitWriteFinish: {
            stabilityThreshold: 300,
        },
        ...(typeof watch === 'object' ? watch : null),
    });
};
