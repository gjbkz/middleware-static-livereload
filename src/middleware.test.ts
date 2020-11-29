import './test-util/fetch';
import * as path from 'path';
import * as http from 'http';
import * as stream from 'stream';
import * as connect from 'connect';
import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import {URL} from 'url';
import anyTest, {TestInterface} from 'ava';
import {middleware as createMiddleware} from './middleware';
import {listen} from './listen';
import {prepareFiles} from './test-util/prepareFiles';
import {createTemporaryDirectory} from './test-util/createTemporaryDirectory';
import {getBaseURL} from './test-util/getBaseURL';
import {LogLevel} from './LogLevel';
import {createLogger} from './test-util/createLogger';
import {writeFile} from './fs';

const test = anyTest as TestInterface<{
    port: number,
    app: connect.Server,
    server: http.Server,
    files: Record<string, Buffer>,
    directory: string,
    baseURL: URL,
    middleware: ReturnType<typeof createMiddleware>,
    connection?: http.IncomingMessage,
}>;

let nextPort = 9200;
test.beforeEach(async (t) => {
    const port = t.context.port = nextPort++;
    const app = t.context.app = connect();
    const server = t.context.server = http.createServer(app);
    const directory = t.context.directory = await createTemporaryDirectory();
    const files = t.context.files = {
        'foo.txt': Buffer.from('foo'),
        'index.html': Buffer.from('<!doctype html>\nindex'),
        'bar/baz1.txt': Buffer.from('baz1'),
        'bar/baz2.txt': Buffer.from('baz2'),
    };
    await Promise.all([
        listen(server, port),
        prepareFiles(files, directory),
    ]);
    t.context.baseURL = getBaseURL(server.address());
});

test.afterEach(async (t) => {
    const {server, middleware, connection} = t.context;
    if (middleware.fileWatcher) {
        await middleware.fileWatcher.close();
    }
    if (connection && !connection.destroyed) {
        connection.destroy();
    }
    await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    });
});

test('GET /foo.txt', async (t) => {
    t.context.middleware = createMiddleware({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    });
    t.context.app.use(t.context.middleware);
    const url = new URL('/foo.txt', t.context.baseURL);
    const res = await fetch(`${url}`);
    t.is(res.status, 200);
    t.is(res.headers.get('content-type'), 'text/plain');
    t.is(`${await res.text()}`, `${t.context.files['foo.txt']}`);
});

test('GET /', async (t) => {
    t.context.middleware = createMiddleware({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    });
    t.context.app.use(t.context.middleware);
    const url = new URL('/', t.context.baseURL);
    const res = await fetch(`${url}`);
    t.is(res.status, 200);
    t.is(res.headers.get('content-type'), 'text/html');
});

test('GET /bar/', async (t) => {
    t.context.middleware = createMiddleware({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    });
    t.context.app.use(t.context.middleware);
    const url = new URL('/bar/', t.context.baseURL);
    const res = await fetch(`${url}`);
    t.is(res.status, 200);
    t.is(res.headers.get('content-type'), 'text/html');
    const html = await res.text();
    t.true(html.includes('baz1'));
    t.true(html.includes('baz2'));
});

test('GET /middleware-static-livereload.js', async (t) => {
    t.context.middleware = createMiddleware({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    });
    t.context.app.use(t.context.middleware);
    const url = new URL('/middleware-static-livereload.js', t.context.baseURL);
    const res = await fetch(`${url}`);
    t.is(res.status, 200);
    t.is(res.headers.get('content-type'), 'text/javascript');
});

test('GET /middleware-static-livereload.js/connect', async (t) => {
    t.context.middleware = createMiddleware({
        documentRoot: t.context.directory,
        logLevel: LogLevel.debug,
        stdout: createLogger(t),
        stderr: createLogger(t),
    });
    const {fileWatcher} = t.context.middleware;
    if (!fileWatcher) {
        t.fail('NoFileWatcher');
        return;
    }
    t.context.app.use(t.context.middleware);
    const url = new URL('/middleware-static-livereload.js/connect', t.context.baseURL);
    const abortController = new AbortController();
    const res = await fetch(`${url}`, {
        signal: abortController.signal,
        headers: {
            'accept': 'text/event-stream',
            'content-type': 'text/event-stream',
            'user-agent': `${process.version} ${process.arch}`,
        },
    });
    const connection = res.body as unknown as NodeJS.ReadableStream;
    Object.assign(t.context, {connection});
    let messages = '';
    const chunks: Array<Buffer> = [];
    connection.pipe(new stream.Writable({
        write(chunk: Buffer, _encoding, callback) {
            chunks.push(chunk);
            if (`${chunk}`.includes('event: change')) {
                messages = `${Buffer.concat(chunks)}`;
                abortController.abort();
            }
            callback();
        },
    }));
    t.is(res.status, 200);
    t.is(res.headers.get('content-type'), 'text/event-stream');
    const waitAddEvent = new Promise((resolve, reject) => {
        fileWatcher
        .once('error', reject)
        .once('add', (file) => {
            fileWatcher.removeListener('error', reject);
            resolve(file);
        });
    });
    const indexFilePath = path.join(t.context.directory, 'index.html');
    const indexRes = await fetch(`${new URL('/', t.context.baseURL)}`);
    t.is(indexRes.status, 200);
    t.is(indexRes.headers.get('content-type'), 'text/html');
    t.is(await waitAddEvent, indexFilePath);
    await writeFile(indexFilePath, Buffer.from('<!doctype html>\nindex2'));
    await new Promise<void>((resolve, reject) => {
        let count = 0;
        const check = () => {
            if (messages) {
                resolve();
            } else if (count++ < 50) {
                setTimeout(check, 100);
            } else {
                reject(new Error('Timeout'));
            }
        };
        check();
    });
    const events = messages.split('\n\n')
    .map((eventMessage) => {
        const event: Record<string, string> = {};
        for (const line of eventMessage.trim().split('\n')) {
            const [key, value] = line.split(/\s*:\s*/);
            if (key && value) {
                event[key.trim()] = value.trim();
            }
        }
        return event;
    })
    .filter((event) => 'id' in event);
    t.deepEqual(events, [
        {id: '0', data: 'index.html', event: 'add'},
        {id: '1', data: 'index.html', event: 'change'},
    ]);
});
