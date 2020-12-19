import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as connect from 'connect';
import * as stream from 'stream';
import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import ava from 'ava';
import {middleware as createMiddleware} from './middleware';
import {listen} from './listen';
import {prepareFiles} from './test-util/prepareFiles';
import {createTemporaryDirectory} from './test-util/createTemporaryDirectory';
import {LogLevel} from './LogLevel';
import {getBaseUrlForServer} from './test-util/getBaseUrl';
import {parseEvents} from './test-util/parseEvents';

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
const abortController = new AbortController();

ava.before(async () => {
    app.use(middleware);
    await Promise.all([
        listen(server, 9300),
        prepareFiles(files, directory),
    ]);
});

ava.after(async () => {
    abortController.abort();
    if (middleware.fileWatcher) {
        await middleware.fileWatcher.close();
    }
    server.close();
});

ava('reload', async (t) => {
    const url = getBaseUrlForServer(server, '/middleware-static-livereload.js/connect');
    t.log(`GET ${url}`);
    const receivedChunks: Array<Buffer> = [];
    const waitMessageChange = async (
        id: string,
    ): Promise<Record<string, string>> => await new Promise((resolve, reject) => {
        const currentLength = receivedChunks.length;
        let count = 0;
        const check = () => {
            t.log(`${id}: check`);
            if (currentLength < receivedChunks.length) {
                const newMessage = `${Buffer.concat(receivedChunks.slice(currentLength))}`;
                const events = [...parseEvents(newMessage)];
                t.is(events.length, 1);
                resolve(events[0]);
            } else if (count++ < 10) {
                setTimeout(check, 500);
            } else {
                t.log(`${id}: timeout`);
                reject(new Error('Timeout'));
            }
        };
        check();
    });
    const [configureEvent] = await Promise.all([
        waitMessageChange('configureEvent'),
        fetch(`${url}`, {
            signal: abortController.signal,
            headers: {
                'accept': 'text/event-stream',
                'content-type': 'text/event-stream',
                'user-agent': `${process.version} ${process.arch}`,
            },
        }).then((res) => {
            t.log(`${res.status} ${res.statusText}`);
            t.is(res.status, 200);
            t.is(res.headers.get('content-type'), 'text/event-stream');
            res.body.pipe(new stream.Writable({
                write(chunk: Buffer, _encoding, callback) {
                    receivedChunks.push(chunk);
                    callback();
                },
            }));
        }),
    ]);
    t.like(configureEvent, {retry: '3000'});
    const indexFilePath = path.join(directory, 'index.html');
    const [addEvent, indexRes] = await Promise.all([
        waitMessageChange('addEvent'),
        fetch(`${getBaseUrlForServer(server, '/')}`),
    ]);
    t.like(addEvent, {data: 'index.html', event: 'add'});
    t.is(indexRes.status, 200);
    t.is(indexRes.headers.get('content-type'), 'text/html');
    const [changeEvent] = await Promise.all([
        waitMessageChange('changeEvent'),
        fs.promises.writeFile(indexFilePath, Buffer.from('<!doctype html>\nindex2')),
    ]);
    t.like(changeEvent, {data: 'index.html', event: 'change'});
});
