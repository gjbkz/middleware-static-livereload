/* eslint-disable max-lines-per-function */
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as stream from 'stream';
import ava from 'ava';
import connect from 'connect';
import {listen} from './listen.ts';
import {LogLevel} from './LogLevel.ts';
import {middleware as createMiddleware} from './middleware.ts';
import {createTemporaryDirectory} from './test-util/createTemporaryDirectory.ts';
import {getBaseUrlForServer} from './test-util/getBaseUrl.ts';
import {parseEvents} from './test-util/parseEvents.ts';
import {prepareFiles} from './test-util/prepareFiles.ts';

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

ava.afterEach(() => {
    abortController.abort();
});

ava.after(async () => {
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
                const event = events[0];
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (event) {
                    resolve(event);
                } else {
                    reject(new Error('NoEvent'));
                }
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
            if (res.body) {
                (res.body as unknown as stream.Readable).pipe(new stream.Writable({
                    write(chunk: Buffer, _encoding, callback) {
                        receivedChunks.push(chunk);
                        callback();
                    },
                }));
            }
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
    t.is(indexRes.headers.get('content-type'), 'text/html; charset=UTF-8');
    const [changeEvent] = await Promise.all([
        waitMessageChange('changeEvent'),
        fs.promises.writeFile(indexFilePath, Buffer.from('<!doctype html>\nindex2')),
    ]);
    t.like(changeEvent, {data: 'index.html', event: 'change'});
    abortController.abort();
});
