import * as stream from 'stream';
import test from 'ava';
import {createSnippetInjector} from './createSnippetInjector.ts';

test('inject the snippet', async (t) => {
    const injectee = 'abc';
    const injector = createSnippetInjector({}, injectee);
    t.is(injector.size, injectee.length);
    const readable = new stream.PassThrough();
    const injected = injector(readable);
    setImmediate(() => {
        readable.write('<!-- comments -->\n');
        readable.write('<!doctype html>\n');
        readable.write('bar');
        readable.end();
    });
    const actual = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Array<Buffer> = [];
        injected.pipe(new stream.Writable({
            write(chunk: Buffer, _encoding, callback) {
                chunks.push(chunk);
                callback();
            },
            final(callback) {
                resolve(Buffer.concat(chunks));
                callback();
            },
        }))
        .once('error', reject);
    });
    t.is(`${actual}`, `<!-- comments -->\n<!doctype html>${injectee}\nbar`);
});
