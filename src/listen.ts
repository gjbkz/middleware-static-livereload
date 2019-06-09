import * as http from 'http';

export const listen = async (
    server: http.Server,
    port: number,
) => {
    let result = port;
    while (1) {
        await new Promise((resolve, reject) => {
            server
            .once('error', (error: NodeJS.ErrnoException) => {
                if (error.code === 'EADDRINUSE') {
                    resolve();
                } else {
                    reject(error);
                }
            })
            .once('listening', () => {
                server.removeListener('error', reject);
                resolve();
            })
            .listen(result);
        });
        if (server.listening) {
            break;
        } else {
            result++;
        }
    }
    return result;
};
