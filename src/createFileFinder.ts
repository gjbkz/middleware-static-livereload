import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {ensureArray} from './ensureArray';
import type {Options} from './types';
import {absolutify} from './absolutify';
import {statOrNull} from './statOrNull';
import {generateIndexHTML} from './generateIndexHTML';
import {LibError} from './LibError';

export const createFileFinder = (
    {documentRoot = [process.cwd()], index = 'index.html'}: Options = {},
    reservedPaths: Record<string, string> = {},
) => {
    const absoluteDocumentRoots = ensureArray(documentRoot).map((pathString) => absolutify(pathString));
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'node-server-'));
    return Object.assign(
        async (pathname: string) => {
            let relativePath = pathname.split('/').filter((x) => x).join(path.sep);
            let absolutePath = reservedPaths[pathname] || null;
            let stats: fs.Stats | null = null;
            if (absolutePath) {
                stats = await statOrNull(absolutePath);
            } else {
                for (const absoluteDocumentRoot of absoluteDocumentRoots) {
                    absolutePath = path.join(absoluteDocumentRoot, relativePath);
                    stats = await statOrNull(absolutePath);
                    if (stats) {
                        if (stats.isFile()) {
                            break;
                        } else if (stats.isDirectory()) {
                            stats = await statOrNull(path.join(absolutePath, index));
                            if (stats && stats.isFile()) {
                                absolutePath = path.join(absolutePath, index);
                                relativePath = path.join(relativePath, index);
                            } else {
                                const indexHTML = await generateIndexHTML(absolutePath, relativePath);
                                absolutePath = path.join(temporaryDirectory, `${relativePath.split(path.sep).join('sep')}.html`);
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
