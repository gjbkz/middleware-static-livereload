import type { FSWatcher, WatchOptions } from 'chokidar';
import { watch } from 'chokidar';

const isFSWatcher = (
  x: FSWatcher | WatchOptions | boolean | undefined,
): x is FSWatcher =>
  typeof x === 'object' &&
  'add' in x &&
  typeof x.add === 'function' &&
  'unwatch' in x &&
  typeof x.unwatch === 'function';

export const createFileWatcher = (
  options: FSWatcher | WatchOptions | boolean | null,
): FSWatcher | null => {
  if (options === false || options === null) {
    return null;
  }
  if (isFSWatcher(options)) {
    return options;
  }
  return watch([], {
    useFsEvents: false,
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 300 },
    ...(typeof options === 'object' ? options : null),
  });
};
