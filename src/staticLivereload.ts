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
import {IFile} from './types';

export const clientScriptURL = `/reload-${Date.now()}.js`;

const clientScriptPath = path.join(__dirname, 'client', 'script.js');
export const clientScript: IFile = {
    path: clientScriptPath,
    relativePath: path.normalize(clientScriptURL),
    stats: fs.statSync(clientScriptPath),
};
const scriptHTML = Buffer.from(`<script src="${clientScriptURL}"></script>`);

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
    const findFile = createFileFinder(options);
    const injectSnippet = createSnippetInjector(options, scriptHTML);
    const watcher = options.chokidar === null ? null : chokidar.watch([], options.chokidar);
    const console = createConsole(options);
    const getContentType = compileContentTypes(options.contentTypes);
    let counter = 0;
    return (req, res) => {
        const id = `#${counter++}`;
        console.info(id, '←', req.method, req.url);
        const url = new URL(req.url || '/', 'http://localhost');
        new Promise<IFile>(async (resolve, reject) => {
            if (url.pathname === clientScriptURL) {
                resolve(clientScript);
            } else {
                findFile(url.pathname).then(resolve, reject);
            }
        })
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
            if (watcher) {
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
