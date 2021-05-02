import * as http from 'http';
import test from 'ava';
import {listen} from './listen';

test('listen an available port', async (t) => {
    const port = 3000;
    const servers: Array<http.Server> = [];
    const ports: Array<number> = [port - 1];
    for (let count = 0; count < 3; count++) {
        const server = http.createServer();
        servers.unshift(server);
        const listening = await listen(server, port);
        t.true(ports[0] < listening);
        ports.unshift(listening);
    }
    for (const server of servers) {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
});
