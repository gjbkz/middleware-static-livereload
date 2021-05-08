import type {ConsoleLike, ServerResponseLike} from './types';

const isObjectWithCode = (input: unknown): input is {code: unknown} => Boolean(input && typeof input === 'object');
const getErrorCode = (error: unknown): string => isObjectWithCode(error) ? `${error.code}` : 'Error';

export const handleError = (
    id: string,
    res: ServerResponseLike,
    error: unknown,
    console: ConsoleLike,
) => {
    console.error(id, error);
    if (!res.writableEnded) {
        if (!res.headersSent) {
            switch (getErrorCode(error)) {
            case 'ENOENT':
                res.statusCode = 404;
                break;
            default:
                res.statusCode = 500;
            }
        }
        res.end(`${error || 'Error'}`);
    }
};
