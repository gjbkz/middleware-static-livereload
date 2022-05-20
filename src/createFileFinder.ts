import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {ensureArray} from './ensureArray';
import type {Options} from './types';
import {absolutify} from './absolutify';
import {statOrNull} from './statOrNull';
import {generateIndexHTML} from './generateIndexHTML';
import {LibError} from './LibError';
import {pathToFileURL} from 'url';

const normalizeDocumentRoot = (pathLike: fs.PathLike) => {
    const url = absolutify(pathLike);
    if (!url.pathname.endsWith('/')) {
        url.pathname = `${url.pathname}/`;
    }
    return url;
};

const normalizeRelativePath = (pathname: string) => {
    let relativePath = pathname;
    if (relativePath.startsWith('/')) {
        relativePath = `.${relativePath}`;
    } else {
        relativePath = `./${relativePath}`;
    }
    return relativePath;
};

export const createFileFinder = (
    {documentRoot = [process.cwd()], index = 'index.html'}: Options = {},
    reservedPaths: Record<string, URL | undefined> = {},
) => {
    const absoluteDocumentRoots = ensureArray(documentRoot).map(normalizeDocumentRoot);
    const temporaryDirectory = pathToFileURL(fs.mkdtempSync(path.join(os.tmpdir(), 'node-server-')));
    return Object.assign(
        async (pathname: string) => {
            let relativePath = normalizeRelativePath(pathname);
            let absolutePath = reservedPaths[pathname] || null;
            let stats: fs.Stats | null = null;
            if (absolutePath) {
                stats = await statOrNull(absolutePath);
            } else {
                for (const absoluteDocumentRoot of absoluteDocumentRoots) {
                    absolutePath = new URL(relativePath, absoluteDocumentRoot);
                    stats = await statOrNull(absolutePath);
                    if (stats) {
                        if (stats.isFile()) {
                            break;
                        } else if (stats.isDirectory()) {
                            stats = await statOrNull(new URL(index, absolutePath));
                            if (stats && stats.isFile()) {
                                absolutePath = new URL(index, absolutePath);
                                relativePath = path.join(relativePath, index);
                            } else {
                                const indexHTML = await generateIndexHTML(absolutePath, relativePath);
                                absolutePath = new URL(`${relativePath.split(path.sep).join('sep')}.html`, temporaryDirectory);
                                await fs.promises.writeFile(absolutePath, indexHTML);
                                stats = await statOrNull(absolutePath);
                            }
                            break;
                        }
                    } else {
                        absolutePath = stats = null;
                    }
                }
            }
            if (stats && absolutePath) {
                return {path: absolutePath, relativePath, stats};
            }
            throw new LibError('ENOENT', relativePath);
        },
        {
            documentRoots: absoluteDocumentRoots,
            isReserved: (relativePath: string) => relativePath in reservedPaths,
        },
    );
};
