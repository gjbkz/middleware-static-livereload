import * as path from 'path';
import * as fs from 'fs';
import * as connect from 'connect';
import {URL} from 'url';
import {IOptions} from './types';
import {getFunctions} from './getFunctions';
import {handleError} from './handleError';

export const getPathFromURL = (
    url: URL,
    index: string,
) => url.pathname.replace(/\/$/, index).split('/').join(path.sep);

export const staticLivereload = (
    options?: IOptions,
): connect.SimpleHandleFunction => {
    const {findFile, watcher, console} = getFunctions(options);
    let counter = 0;
    return (req, res) => {
        const id = `#${counter++}`;
        console.info(`${id} < ${req.method} ${req.url}`);
        const url = new URL(req.url || '/', 'http://localhost');
        findFile(url.pathname)
        .then(({file, stats}) => {
            console.info(id, file, stats.size);
            const headers = {
                'content-length': stats.size,
            };
            console.debug(id, headers);
            res.writeHead(200, headers);
            fs.createReadStream(file).pipe(res);
            if (watcher) {
                watcher.add(file);
            }
        })
        .catch((error) => {
            console.error(id, error);
            handleError(res, error);
        });
    };
};
