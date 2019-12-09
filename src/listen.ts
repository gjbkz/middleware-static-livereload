import * as http from 'http';
const hostname = 'localhost';

export const listenPort = async (
    server: http.Server,
    port: number,
) => {
    await new Promise((resolve, reject) => {
        server
        .once('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE' || error.code === 'EADDRNOTAVAIL') {
                resolve();
            } else {
                reject(error);
            }
        })
        .once('listening', () => {
            server.removeListener('error', reject);
            resolve();
        })
        .listen(port, hostname);
    });
};

export const listen = async (
    server: http.Server,
    port: number,
): Promise<number> => {
    await listenPort(server, port);
    if (server.listening) {
        return port;
    } else {
        return await listen(server, port + 1);
    }
};
