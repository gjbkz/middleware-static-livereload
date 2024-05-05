import type * as http from 'http';
import {compileEvent} from './compileEvent.ts';
import type {ConsoleLike} from './types.ts';

export const createConnectionHandler = (
    options: {console: ConsoleLike},
) => {
    const {console} = options;
    const EventStreamType = 'text/event-stream';
    const connections = new Set<http.ServerResponse>();
    const sendEvent = (
        data: string,
        eventName?: string,
    ) => {
        const event = compileEvent(data, eventName);
        console.debug(event);
        for (const connection of connections) {
            connection.write(event);
        }
    };
    setInterval(() => {
        for (const connection of connections) {
            connection.write(': keepalive');
        }
    }, 8000);
    let counter = 0;
    return Object.assign(
        (req: http.IncomingMessage, res: http.ServerResponse) => {
            if (req.headers.accept === EventStreamType) {
                const id = counter++;
                connections.add(res);
                res.statusCode = 200;
                res.setHeader('content-type', EventStreamType);
                res.write(`retry: 3000\ndata: #${id}\n\n`);
                console.info(`connected: #${id} ${req.headers['user-agent']}`);
                res.once('close', () => {
                    connections.delete(res);
                    console.info(`disconnected: #${id}`);
                });
            } else {
                const message = `Invaild event-stream request: ${req.headers.accept}`;
                res.statusCode = 400;
                console.error(message);
                res.end(message);
            }
        },
        {sendEvent},
    );
};
