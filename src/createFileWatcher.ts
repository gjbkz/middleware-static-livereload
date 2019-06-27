import * as chokidar from 'chokidar';
import {IOptions} from './types';

const isFSWatcher = (
    x: boolean | chokidar.WatchOptions | chokidar.FSWatcher | undefined,
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
        ...(typeof watch === 'object' ? watch : null),
    });
};
