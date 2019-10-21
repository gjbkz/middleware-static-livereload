import * as stream from 'stream';

export const createLogger = (
    t: {log: (...input: Array<any>) => void},
): stream.Writable => new stream.Writable({
    write(chunk, _encoding, callback) {
        t.log(`${chunk}`);
        callback();
    },
});
