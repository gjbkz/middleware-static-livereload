import * as ava from 'ava';
import * as stream from 'stream';

export const createLogger = (
    t: ava.ExecutionContext,
): stream.Writable => new stream.Writable({
    write(chunk, _encoding, callback) {
        t.log(`${chunk}`);
        callback();
    },
});
