import * as stream from 'stream';
import {StringDecoder} from 'string_decoder';
import type {ISnippetInjector, IOptions} from './types';
import {createInserter} from './createInserter';

export const createSnippetInjector = (
    options: IOptions,
    injecteeSource: Buffer | string,
): ISnippetInjector => {
    const injectee = Buffer.isBuffer(injecteeSource) ? injecteeSource : Buffer.from(injecteeSource);
    return Object.assign(
        (readable: stream.Readable) => {
            const stringDecoder = new StringDecoder(options.encoding);
            const insert = createInserter(options);
            let done = false;
            const chunks: Array<string> = [];
            const injector = new stream.Transform({
                transform(chunk, _encoding, callback) {
                    const string = stringDecoder.write(chunk);
                    if (!done) {
                        const inserted = insert(string, injectee);
                        if (inserted) {
                            this.push(inserted);
                            chunks.push(inserted);
                            done = true;
                            callback();
                            return;
                        }
                    }
                    chunks.push(string);
                    this.push(string);
                    callback();
                },
                flush(callback) {
                    let string = stringDecoder.end();
                    if (string) {
                        process.stdout.write(`string: ${string}\n`);
                        string = (!done && insert(string, injectee)) || string;
                        chunks.push(string);
                        this.push(string);
                    }
                    callback();
                },
            });
            return readable.pipe(injector);
        },
        {size: injectee.length},
    );
};
