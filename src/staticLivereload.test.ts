// import * as path from 'path';
import * as http from 'http';
import * as connect from 'connect';
import anyTest, {TestInterface} from 'ava';
import {staticLivereload} from './staticLivereload';

const test = anyTest as TestInterface<{
    port: number,
    app: connect.Server,
    server: http.Server,
}>;

const listen = (
    {server, port}: {server: http.Server, port: number},
) => new Promise((resolve, reject) => {
    server
    .once('error', reject)
    .once('listening', () => {
        server.removeListener('error', reject);
        resolve();
    })
    .listen(port);
});

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
    t.context.server = http.createServer();
});

test.afterEach(async (t) => {
    await new Promise((resolve, reject) => {
        t.context.server.close((error) => error ? reject(error) : resolve());
    });
});

test('static', async (t) => {
    const {app, server} = t.context;
    app.use(staticLivereload({

    }));
    await listen(t.context);
    t.true(server.listening);
});
