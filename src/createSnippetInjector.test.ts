import * as stream from 'stream';
import test from 'ava';
import {createSnippetInjector} from './createSnippetInjector';
import {readStream} from './test-util/readStream';

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
    const actual = await readStream(injected);
    t.is(`${actual}`, `<!-- comments -->\n<!doctype html>${injectee}\nbar`);
});
