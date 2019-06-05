import * as http from 'http';

export const handleError = (
    res: http.ServerResponse,
    error: Error & {code?: string},
) => {
    switch (error.code) {
    case 'ENOENT':
        res.writeHead(404);
        break;
    default:
        res.writeHead(500);
    }
    res.end(`${error.stack || error}`);
};
