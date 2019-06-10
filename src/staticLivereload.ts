import * as fs from 'fs';
import * as connect from 'connect';
import * as stream from 'stream';
import {URL} from 'url';
import {handleError} from './handleError';
import {IOptions} from './types';
import {getTools} from './getTools';

export const staticLivereload = (
    options: IOptions,
): connect.SimpleHandleFunction => {
    const {
        console,
        findFile,
        injectSnippet,
        getContentType,
        handleConnection,
        watcher,
        connectionPath,
    } = getTools(options);
    let counter = 0;
    return (req, res) => {
        const id = `#${counter++}`;
        console.info(id, '←', req.method, req.url);
        const url = new URL(req.url || '/', 'http://localhost');
        if (url.pathname.startsWith(connectionPath)) {
            handleConnection(req, res);
            return;
        }
        findFile(url.pathname)
        .then(async (file) => {
            console.debug(id, '→', file.path);
            res.statusCode = 200;
            const contentType = getContentType(file.path);
            if (contentType) {
                res.setHeader('content-type', contentType);
            }
            let reader: stream.Readable = fs.createReadStream(file.path);
            if (res.getHeader('content-type') === 'text/html') {
                res.setHeader('content-length', file.stats.size + injectSnippet.size);
                reader = injectSnippet(reader);
            } else {
                res.setHeader('content-length', file.stats.size);
            }
            await new Promise((resolve, reject) => {
                reader.pipe(res).once('error', reject).once('finish', resolve);
            });
            if (watcher && !findFile.isReserved(url.pathname)) {
                watcher.add(file.path);
            }
        })
        .catch((error) => handleError(id, res, error, console))
        .finally(() => console.debug(id, '→', res.statusCode, {...res.getHeaders()}));
    };
};
