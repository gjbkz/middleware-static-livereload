import test from 'ava';
import * as chokidar from 'chokidar';
import {createFileWatcher} from './createFileWatcher';

test('return null', (t) => {
    t.is(createFileWatcher({watch: false}), null);
    t.is(createFileWatcher({watch: null}), null);
});

test('return watcher-like', (t) => {
    const watcher = chokidar.watch([]);
    t.is(createFileWatcher({watch: watcher}), watcher);
    watcher.close();
});

test('return a watcher', (t) => {
    const interval = 123;
    const watcher = createFileWatcher({watch: {interval}});
    t.true(watcher instanceof chokidar.FSWatcher);
    if (watcher) {
        t.is(watcher.options.interval, interval);
        watcher.close();
    }
});
