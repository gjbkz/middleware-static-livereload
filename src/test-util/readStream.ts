import * as stream from 'stream';

export const readStream = (
    readable: stream.Readable,
): Promise<Buffer> => new Promise((resolve, reject) => {
    const chunks: Array<Buffer> = [];
    let totalLength = 0;
    readable.pipe(new stream.Writable({
        write(chunk: Buffer, _encoding, callback) {
            chunks.push(chunk);
            totalLength += chunk.length;
            callback();
        },
        final(callback) {
            resolve(Buffer.concat(chunks, totalLength));
            callback();
        },
    }))
    .once('error', reject);
});

