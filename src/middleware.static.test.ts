import * as http from 'http';
import * as connect from 'connect';
import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import ava from 'ava';
import {middleware as createMiddleware} from './middleware';
import {listen} from './listen';
import {prepareFiles} from './test-util/prepareFiles';
import {createTemporaryDirectory} from './test-util/createTemporaryDirectory';
import {LogLevel} from './LogLevel';
import {getBaseUrlForServer} from './test-util/getBaseUrl';

const app = connect();
const server = http.createServer(app);
const directory = createTemporaryDirectory();
const files = {
    'foo.txt': Buffer.from('foo'),
    'index.html': Buffer.from('<!doctype html>\nindex'),
    'bar/baz1.txt': Buffer.from('baz1'),
    'bar/baz2.txt': Buffer.from('baz2'),
};
const middleware = createMiddleware({
    documentRoot: directory,
    logLevel: LogLevel.debug,
});

ava.before(async () => {
    app.use(middleware);
    await Promise.all([
        listen(server, 9200),
        prepareFiles(files, directory),
    ]);
});

ava.after(async () => {
    if (middleware.fileWatcher) {
        await middleware.fileWatcher.close();
    }
    server.close();
});

ava.serial('GET /foo.txt', async (t) => {
    const url = getBaseUrlForServer(server, '/foo.txt');
    t.log(`GET ${url}`);
    const res = await fetch(`${url}`);
    t.log(`${res.status} ${res.statusText}`);
    t.is(res.status, 200);
    t.is(res.headers.get('content-type'), 'text/plain');
    t.is(`${await res.text()}`, `${files['foo.txt']}`);
});

ava.serial('GET /', async (t) => {
    const url = getBaseUrlForServer(server, '/');
    t.log(`GET ${url}`);
    const res = await fetch(`${url}`);
    t.log(`${res.status} ${res.statusText}`);
    t.is(res.status, 200);
    t.is(res.headers.get('content-type'), 'text/html');
});

ava.serial('GET /bar/', async (t) => {
    const url = getBaseUrlForServer(server, '/bar/');
    t.log(`GET ${url}`);
    const res = await fetch(`${url}`);
    t.log(`${res.status} ${res.statusText}`);
    t.is(res.status, 200);
    t.is(res.headers.get('content-type'), 'text/html');
    const html = await res.text();
    t.true(html.includes('baz1'));
    t.true(html.includes('baz2'));
});

ava.serial('GET /middleware-static-livereload.js', async (t) => {
    const url = getBaseUrlForServer(server, '/middleware-static-livereload.js');
    t.log(`GET ${url}`);
    const res = await fetch(`${url}`);
    t.log(`${res.status} ${res.statusText}`);
    t.is(res.status, 200);
    t.is(res.headers.get('content-type'), 'text/javascript');
});

ava.serial('GET /middleware-static-livereload.js/connect', async (t) => {
    const url = getBaseUrlForServer(server, '/middleware-static-livereload.js/connect');
    t.log(`GET ${url}`);
    const abortController = new AbortController();
    const res = await fetch(`${url}`, {
        signal: abortController.signal,
        headers: {
            'accept': 'text/event-stream',
            'content-type': 'text/event-stream',
            'user-agent': `${process.version} ${process.arch}`,
        },
    });
    t.log(`${res.status} ${res.statusText}`);
    t.is(res.status, 200);
    t.is(res.headers.get('content-type'), 'text/event-stream');
    abortController.abort();
});
