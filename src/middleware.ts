/* eslint-disable @typescript-eslint/no-floating-promises */
import * as fs from 'fs';
import type * as connect from 'connect';
import type * as stream from 'stream';
import type * as chokidar from 'chokidar';
import {URL} from 'url';
import {handleError} from './handleError';
import type {Options} from './types';
import {getTools} from './getTools';

interface MiddlewareResult extends connect.NextHandleFunction {
    fileWatcher: chokidar.FSWatcher | null,
}

export const middleware = (options?: Options): MiddlewareResult => {
    const {fileWatcher, console, connectionPath, handleConnection, findFile, getContentType, injectSnippet} = getTools(options);
    let counter = 0;
    const middlewareFn: connect.NextHandleFunction = (req, res, next) => {
        const id = `#${counter++}`;
        console.info(id, '←', req.method, req.url);
        const url = new URL(req.url || '/', 'http://localhost');
        if (url.pathname.startsWith(connectionPath)) {
            handleConnection(req, res);
        } else {
            findFile(url.pathname)
            .then(async (file) => {
                console.debug(id, '→', file.path);
                const contentType = getContentType(file.path);
                if (contentType) {
                    res.setHeader('content-type', contentType);
                }
                let reader: stream.Readable = fs.createReadStream(file.path);
                if (`${res.getHeader('content-type')}`.startsWith('text/html')) {
                    res.setHeader('content-length', file.stats.size + injectSnippet.size);
                    reader = injectSnippet(reader);
                } else {
                    res.setHeader('content-length', file.stats.size);
                }
                await new Promise((resolve, reject) => {
                    res.statusCode = 200;
                    reader.pipe(res).once('error', reject).once('finish', resolve);
                });
                if (fileWatcher && findFile.documentRoots.find((documentRoot) => file.path.startsWith(documentRoot))) {
                    fileWatcher.add(file.path);
                }
            })
            .catch((error) => {
                handleError(id, res, error, console);
                next(error);
            })
            .then(() => console.debug(id, '→', res.statusCode, {...res.getHeaders()}));
        }
    };
    return Object.assign(middlewareFn, {fileWatcher});
};
