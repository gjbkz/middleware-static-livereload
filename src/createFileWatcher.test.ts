import test from 'ava';
import * as chokidar from 'chokidar';
import {createFileWatcher} from './createFileWatcher.ts';

test('return null', (t) => {
    t.is(createFileWatcher({watch: false}), null);
    t.is(createFileWatcher({watch: null}), null);
});

test('return watcher-like', async (t) => {
    const watcher = chokidar.watch([]);
    t.is(createFileWatcher({watch: watcher}), watcher);
    await watcher.close();
});

test('return a watcher', async (t) => {
    const interval = 123;
    const watcher = createFileWatcher({watch: {interval}});
    t.true(watcher instanceof chokidar.FSWatcher);
    if (watcher) {
        t.is(watcher.options.interval, interval);
        await watcher.close();
    }
});
