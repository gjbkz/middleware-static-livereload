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
    baseURL: URL,
}>;

/**
 * https://www.browserstack.com/question/664
 * Question: What ports can I use to test development environments or private
 * servers using BrowserStack?
 * → We support all ports for all browsers other than Safari.
 */
let port = 9200;
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
    await Promise.all([
        listen(t.context.server, t.context.port),
        prepareFiles(t.context.files, t.context.directory),
    ]);
    t.context.baseURL = getBaseURL(t.context.server.address());
});

test.afterEach(async (t) => {
    await new Promise((resolve, reject) => {
        t.context.server.close((error) => error ? reject(error) : resolve());
    });
});

test('GET /foo.txt', async (t) => {
    t.context.app.use(staticLivereload({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    }));
    const url = new URL('/foo.txt', t.context.baseURL);
    const res = await request('GET', url);
    t.is(res.statusCode, 200);
    t.is(res.headers['content-type'], 'text/plain');
    t.is(`${await readStream(res)}`, `${t.context.files['foo.txt']}`);
});

test('GET /', async (t) => {
    t.context.app.use(staticLivereload({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    }));
    const url = new URL('/', t.context.baseURL);
    const res = await request('GET', url);
    t.is(res.statusCode, 200);
    t.is(res.headers['content-type'], 'text/html');
});

test('GET /middleware-static-livereload.js', async (t) => {
    t.context.app.use(staticLivereload({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    }));
    const url = new URL('/middleware-static-livereload.js', t.context.baseURL);
    const res = await request('GET', url);
    t.is(res.statusCode, 200);
    t.is(res.headers['content-type'], 'text/javascript');
});

test('GET /middleware-static-livereload.js/connect', async (t) => {
    t.context.app.use(staticLivereload({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    }));
    const url = new URL('/middleware-static-livereload.js/connect', t.context.baseURL);
    const res = await request('GET', url, {
        headers: {
            'accept': 'text/event-stream',
            'content-type': 'text/event-stream',
        },
    });
    t.is(res.statusCode, 200);
    t.is(res.headers['content-type'], 'text/event-stream');
    res.destroy();
});
