import * as http from 'http';
import {IConsole, IConnectionHandler} from './types';
import {compileEvent} from './compileEvent';

export const createConnectionHandler = (
    console: IConsole,
): IConnectionHandler => {
    let counter = 0;
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
    return {
        handler: (req, res) => {
            if (req.headers.accept !== EventStreamType) {
                const message = `Invaild event-stream request: ${req.headers.accept}`;
                res.statusCode = 400;
                console.error(message);
                res.end(message);
            } else {
                let id = counter++;
                connections.add(res);
                res.statusCode = 200;
                res.setHeader('content-type', EventStreamType);
                res.write(`retry: 3000\ndata: #${id}\n\n`);
                console.info(`connected: #${id} ${req.headers['user-agent']}`);
                res.once('close', () => {
                    connections.delete(res);
                    console.info(`disconnected: #${id}`);
                });
            }
        },
        sendEvent,
    };
};
