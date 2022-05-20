import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {pathToFileURL} from 'url';
import {absolutify} from './absolutify';
import {ensureArray} from './ensureArray';
import {generateIndexHTML} from './generateIndexHTML';
import {LibError} from './LibError';
import {statOrNull} from './statOrNull';
import type {Options} from './types';

const normalizeDocumentRoot = (pathLike: fs.PathLike) => {
    const url = absolutify(pathLike);
    if (!url.pathname.endsWith('/')) {
        url.pathname = `${url.pathname}/`;
    }
    return url;
};

const generateIndex = async (
    absolutePath: URL,
    relativePath: string,
    dest: URL,
) => {
    await fs.promises.mkdir(new URL('.', dest), {recursive: true});
    const w = fs.createWriteStream(dest);
    for await (const line of generateIndexHTML(absolutePath, relativePath)) {
        w.write(`${line}\n`);
    }
    await new Promise((resolve, reject) => {
        w.once('error', reject);
        w.once('close', resolve);
        w.end();
    });
    return dest;
};

export const createFileFinder = (
    {documentRoot = [process.cwd()], index = 'index.html'}: Options = {},
    reservedPaths: Record<string, URL | undefined> = {},
) => {
    const absoluteDocumentRoots = ensureArray(documentRoot).map(normalizeDocumentRoot);
    const temporaryDirectory = pathToFileURL(fs.mkdtempSync(path.join(os.tmpdir(), 'node-server-')));
    return Object.assign(
        async (pathname: string) => {
            let relativePath = pathname;
            let absolutePath = reservedPaths[pathname] || null;
            let stats: fs.Stats | null = null;
            if (absolutePath) {
                stats = await statOrNull(absolutePath);
            } else {
                for (const absoluteDocumentRoot of absoluteDocumentRoots) {
                    absolutePath = new URL(relativePath.slice(1), absoluteDocumentRoot);
                    stats = await statOrNull(absolutePath);
                    if (stats) {
                        if (stats.isFile()) {
                            break;
                        } else if (stats.isDirectory()) {
                            const indexUrl = new URL(index, absolutePath);
                            stats = await statOrNull(indexUrl);
                            if (stats && stats.isFile()) {
                                absolutePath = indexUrl;
                                relativePath = path.join(relativePath, index);
                            } else {
                                absolutePath = await generateIndex(absolutePath, relativePath, new URL(`${relativePath.slice(1)}${index}`, temporaryDirectory));
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
