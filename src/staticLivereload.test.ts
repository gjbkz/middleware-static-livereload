import * as http from 'http';
import * as connect from 'connect';
import {URL} from 'url';
import anyTest, {TestInterface} from 'ava';
import {staticLivereload} from './staticLivereload';
import {listen} from './listen';
import {prepareFiles} from './test-util/prepareFiles';
import {createTemporaryDirectory} from './test-util/createTemporaryDirectory';
import {getBaseURL} from './test-util/getBaseURL';
import {request} from './test-util/request';
import {readStream} from './test-util/readStream';
import {LogLevel} from './types';
import {createLogger} from './test-util/createLogger';

const test = anyTest as TestInterface<{
    port: number,
    app: connect.Server,
    server: http.Server,
    files: {
        [path: string]: Buffer,
    },
    directory: string,
}>;

/**
 * https://www.browserstack.com/question/664
 * Question: What ports can I use to test development environments or private
 * servers using BrowserStack?
 * → We support all ports for all browsers other than Safari.
 */
let port = 8000;
test.beforeEach(async (t) => {
    t.context.port = port++;
    t.context.app = connect();
    t.context.server = http.createServer(t.context.app);
    t.context.directory = await createTemporaryDirectory();
    t.context.files = {
        'foo.txt': Buffer.from([
            'foo',
        ].join('\n')),
        'index.html': Buffer.from([
            '<!doctype html>',
            'index',
        ].join('\n')),
    };
    await prepareFiles(t.context.files, t.context.directory);
});

test.afterEach(async (t) => {
    await new Promise((resolve, reject) => {
        t.context.server.close((error) => error ? reject(error) : resolve());
    });
});

test('GET a file', async (t) => {
    t.context.app.use(staticLivereload({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    }));
    await listen(t.context.server, t.context.port);
    const baseURL = getBaseURL(t.context.server.address());
    const resFoo = await request('GET', new URL('/foo.txt', baseURL));
    t.is(resFoo.statusCode, 200);
    t.is(resFoo.headers['content-type'], 'text/plain');
    t.is(`${await readStream(resFoo)}`, `${t.context.files['foo.txt']}`);
    const resIndex = await request('GET', new URL('/', baseURL));
    t.is(resIndex.statusCode, 200);
    t.is(resIndex.headers['content-type'], 'text/html');
    const resScript = await request('GET', new URL('/middleware-static-livereload/script.js', baseURL));
    t.is(resScript.statusCode, 200);
    t.is(resScript.headers['content-type'], 'text/javascript');
});
