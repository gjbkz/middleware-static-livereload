import type {ConsoleLike, ServerResponseLike} from './types';

export const handleError = (
    id: string,
    res: ServerResponseLike,
    error: Error & {code?: string},
    console: ConsoleLike,
) => {
    console.error(id, error.stack || error);
    if (!res.writableEnded) {
        if (!res.headersSent) {
            switch (error.code) {
            case 'ENOENT':
                res.statusCode = 404;
                break;
            default:
                res.statusCode = 500;
            }
        }
        res.end(`${error.stack || error.message || 'Error'}`);
    }
};
