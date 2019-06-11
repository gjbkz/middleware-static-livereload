import * as stream from 'stream';

export const readStream = (
    readable: stream.Readable,
    listener?: (chunk: Buffer, encoding: string) => void,
): Promise<Buffer> => new Promise((resolve, reject) => {
    const chunks: Array<Buffer> = [];
    let totalLength = 0;
    readable.pipe(new stream.Writable({
        write(chunk: Buffer, encoding, callback) {
            chunks.push(chunk);
            totalLength += chunk.length;
            if (listener) {
                listener(chunk, encoding);
            }
            callback();
        },
        final(callback) {
            resolve(Buffer.concat(chunks, totalLength));
            callback();
        },
    }))
    .once('error', reject);
});

