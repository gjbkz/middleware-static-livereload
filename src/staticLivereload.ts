import * as fs from 'fs';
import * as connect from 'connect';
import * as chokidar from 'chokidar';
import * as stream from 'stream';
import * as path from 'path';
import {URL} from 'url';
import {handleError} from './handleError';
import {createFileFinder} from './createFileFinder';
import {createConsole} from './createConsole';
import {compileContentTypes} from './compileContentTypes';
import {createSnippetInjector} from './createSnippetInjector';
import {getFile} from './getFile';
import {createConnectionHandler} from './createConnectionHandler';
import {IFile} from './types';

export type IOptions = {
    chokidar?: chokidar.WatchOptions,
    contentTypes?: Parameters<typeof compileContentTypes>[0],
}
& Parameters<typeof createSnippetInjector>[0]
& Parameters<typeof createFileFinder>[0]
& Parameters<typeof createConsole>[0];

export const staticLivereload = (
    options: IOptions = {},
): connect.SimpleHandleFunction => {
    const reservedPaths = new Map<string, string>();
    const reservedURL = '/middleware-static-livereload';
    const clientScriptPath = `${reservedURL}/script.js`;
    const findFile = createFileFinder(options);
    const scriptHTML = Buffer.from(`<script id="middleware-static-livereload" src="${clientScriptPath}" defer></script>`);
    reservedPaths.set(clientScriptPath, path.join(__dirname, 'client', 'script.js'));
    reservedPaths.set(`${clientScriptPath}/polyfill.js`, require.resolve('event-source-polyfill/src/eventsource.min.js'));
    const injectSnippet = createSnippetInjector(options, scriptHTML);
    const console = createConsole(options);
    const getContentType = compileContentTypes(options.contentTypes);
    const serverEvent = createConnectionHandler(console);
    const watcher = options.chokidar === null ? null : chokidar.watch([], options.chokidar)
    .on('all', (eventName, file) => {
        console.debug(`${eventName}: ${file}`);
        const documentRoot = findFile.resolveDocumentRoot(file);
        const pathname = path.relative(documentRoot, file).split(path.sep).join('/');
        serverEvent.sendEvent(pathname, eventName);
    });
    const getFileFromPathname = (pathname: string): Promise<IFile> => {
        const reserved = reservedPaths.get(pathname);
        if (reserved) {
            return getFile(reserved);
        }
        return findFile(pathname);
    };
    let counter = 0;
    return (req, res) => {
        const id = `#${counter++}`;
        console.info(id, '←', req.method, req.url);
        const url = new URL(req.url || '/', 'http://localhost');
        if (url.pathname === `${clientScriptPath}/connect`) {
            return serverEvent.handler(req, res);
        }
        getFileFromPathname(url.pathname)
        .then(async (file) => {
            console.debug(id, '→', file.path);
            res.statusCode = 200;
            const contentType = getContentType(file.path);
            if (contentType) {
                res.setHeader('content-type', contentType);
            }
            let reader: stream.Readable = fs.createReadStream(file.path);
            if (res.getHeader('content-type') === 'text/html') {
                res.setHeader('content-length', file.stats.size + scriptHTML.length);
                reader = injectSnippet(reader);
            } else {
                res.setHeader('content-length', file.stats.size);
            }
            await new Promise((resolve, reject) => {
                reader.pipe(res)
                .once('error', reject)
                .once('finish', resolve);
            });
            if (watcher && !reservedPaths.has(url.pathname)) {
                watcher.add(file.path);
            }
        })
        .catch((error) => {
            console.error(id, error);
            handleError(res, error);
        })
        .finally(() => {
            console.debug(id, '→', res.statusCode, {...res.getHeaders()});
        });
    };
};
