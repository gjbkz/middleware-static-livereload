import {Writable} from 'stream';
import test from 'ava';
import {createWriter} from './createWriter';

test('create a writer', (t) => {
    const chunks: Array<string> = [];
    const w = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(`${chunk}`);
            callback();
        },
    });
    const writer = createWriter(w, {});
    writer(123, 'abc');
    t.deepEqual(chunks, ['123 abc\n']);
});

test('create a writer with an unwritable stream', (t) => {
    const chunks: Array<string> = [];
    const w = new Writable({
        write(chunk, _encoding, callback) {
            chunks.push(`${chunk}`);
            callback();
        },
    });
    w.end();
    const writer = createWriter(w, {});
    writer(123, 'abc');
    t.deepEqual(chunks, []);
});
