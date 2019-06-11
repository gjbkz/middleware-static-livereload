import * as path from 'path';
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
import {writeFile} from './fs';
import {parseEvents} from './test-util/parseEvent';

const test = anyTest as TestInterface<{
    port: number,
    app: connect.Server,
    server: http.Server,
    files: {[path: string]: Buffer},
    directory: string,
    baseURL: URL,
    middleware: ReturnType<typeof staticLivereload>,
}>;

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
        'bar/baz1.txt': Buffer.from([
            'baz1',
        ].join('\n')),
        'bar/baz2.txt': Buffer.from([
            'baz2',
        ].join('\n')),
    };
    await Promise.all([
        listen(t.context.server, t.context.port),
        prepareFiles(t.context.files, t.context.directory),
    ]);
    t.context.baseURL = getBaseURL(t.context.server.address());
});

test.afterEach(async (t) => {
    const {middleware, server} = t.context;
    if (middleware.fileWatcher) {
        middleware.fileWatcher.close();
    }
    await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

test('GET /foo.txt', async (t) => {
    t.context.middleware = staticLivereload({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    });
    t.context.app.use(t.context.middleware);
    const url = new URL('/foo.txt', t.context.baseURL);
    const res = await request('GET', url);
    t.is(res.statusCode, 200);
    t.is(res.headers['content-type'], 'text/plain');
    t.is(`${await readStream(res)}`, `${t.context.files['foo.txt']}`);
});

test('GET /', async (t) => {
    t.context.middleware = staticLivereload({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    });
    t.context.app.use(t.context.middleware);
    const url = new URL('/', t.context.baseURL);
    const res = await request('GET', url);
    t.is(res.statusCode, 200);
    t.is(res.headers['content-type'], 'text/html');
});

test('GET /bar/', async (t) => {
    t.context.middleware = staticLivereload({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    });
    t.context.app.use(t.context.middleware);
    const url = new URL('/bar/', t.context.baseURL);
    const res = await request('GET', url);
    t.is(res.statusCode, 200);
    t.is(res.headers['content-type'], 'text/html');
    const html = `${await readStream(res)}`;
    t.true(html.includes('baz1'));
    t.true(html.includes('baz2'));
});

test('GET /middleware-static-livereload.js', async (t) => {
    t.context.middleware = staticLivereload({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    });
    t.context.app.use(t.context.middleware);
    const url = new URL('/middleware-static-livereload.js', t.context.baseURL);
    const res = await request('GET', url);
    t.is(res.statusCode, 200);
    t.is(res.headers['content-type'], 'text/javascript');
});

test('GET /middleware-static-livereload.js/connect', async (t) => {
    setTimeout(() => {
        if (connection) {
            connection.destroy();
        }
        t.fail('timeout');
    }, 5000);
    t.context.middleware = staticLivereload({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    });
    const {fileWatcher} = t.context.middleware;
    if (!fileWatcher) {
        t.truthy(fileWatcher);
        return;
    }
    t.context.app.use(t.context.middleware);
    const url = new URL('/middleware-static-livereload.js/connect', t.context.baseURL);
    const connection = await request('GET', url, {
        headers: {
            'accept': 'text/event-stream',
            'content-type': 'text/event-stream',
            'user-agent': `${process.version} ${process.arch}`,
        },
    });
    const reader = readStream(connection, (received) => {
        if (`${received}`.includes('event: change')) {
            connection.destroy();
        }
    });
    t.is(connection.statusCode, 200);
    t.is(connection.headers['content-type'], 'text/event-stream');
    const waitAddEvent = new Promise((resolve, reject) => {
        fileWatcher
        .once('error', reject)
        .once('add', (file) => {
            fileWatcher.removeListener('error', reject);
            resolve(file);
        });
    });
    const indexFilePath = path.join(t.context.directory, 'index.html');
    const indexUrl = new URL('/', t.context.baseURL);
    const indexRes = await request('GET', indexUrl);
    t.is(indexRes.statusCode, 200);
    t.is(indexRes.headers['content-type'], 'text/html');
    t.is(await waitAddEvent, indexFilePath);
    await writeFile(indexFilePath, Buffer.from('<!doctype html>\nindex2'));
    const events = parseEvents(await reader);
    t.deepEqual(events, [
        {data: '#0', retry: '3000'},
        {id: '0', event: 'add', data: 'index.html'},
        {id: '1', event: 'change', data: 'index.html'},
    ]);
});
