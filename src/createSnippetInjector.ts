import * as stream from 'stream';
import {StringDecoder} from 'string_decoder';
import {ISnippetInjector} from './types';
import {createInserter} from './createInserter';

export const createSnippetInjector = (
    options: {encoding?: BufferEncoding} & Parameters<typeof createInserter>[0] = {},
    injectee: string | Buffer,
): ISnippetInjector => (
    readable: stream.Readable,
) => {
    const stringDecoder = new StringDecoder(options.encoding);
    const insert = createInserter(options);
    let done = false;
    const injector = new stream.Transform({
        transform(chunk, _encoding, callback) {
            if (!done) {
                const inserted = insert(stringDecoder.write(chunk), injectee);
                if (inserted) {
                    this.push(inserted);
                    done = true;
                    callback();
                    return;
                }
            }
            this.push(chunk);
            callback();
        },
        flush(callback) {
            const flushed = stringDecoder.end();
            if (flushed) {
                this.push((!done && insert(flushed, injectee)) || flushed);
            }
            callback();
        },
    });
    return readable.pipe(injector);
};
