import type * as http from 'http';
const hostname = 'localhost';
const isRecord = (input: unknown): input is Record<string, unknown> => typeof input === 'object' && input !== null;

export const listenPort = async (
    server: http.Server,
    port: number,
) => {
    await new Promise<void>((resolve, reject) => {
        server
        .once('error', (error: unknown) => {
            if (isRecord(error) && (error.code === 'EADDRINUSE' || error.code === 'EADDRNOTAVAIL')) {
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
