import * as http from 'http';
import {IConsole} from './types';

export const handleError = (
    id: string,
    res: http.ServerResponse,
    error: Error & {code?: string},
    console: IConsole,
) => {
    console.error(id, error.stack || error);
    if (!res.headersSent) {
        switch (error.code) {
        case 'ENOENT':
            res.writeHead(404);
            break;
        default:
            res.writeHead(500);
        }
    }
    if (!res.finished) {
        res.end(`${error.stack || error}`);
    }
};
