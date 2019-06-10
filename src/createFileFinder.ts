import * as path from 'path';
import * as fs from 'fs';
import {ensureArray} from './ensureArray';
import {IFileFinder} from './types';
import {absolutify} from './absolutify';
import {statIfExist} from './fs';

export const createFileFinder = (
    {
        documentRoot = process.cwd(),
        index = 'index.html',
    }: {
        documentRoot?: string | Array<string>,
        index?: string,
    } = {},
    reservedPaths: {
        [relativePath: string]: string | undefined,
    } = {},
): IFileFinder => {
    const absoluteDocumentRoots = ensureArray(documentRoot).map((documentRoot) => absolutify(documentRoot));
    return Object.assign(
        async (pathname: string) => {
            const relativePath = pathname.replace(/\/$/, `/${index}`).split('/').join(path.sep);
            let absolutePath = reservedPaths[relativePath] || null;
            let stats: fs.Stats | null = null;
            if (absolutePath) {
                stats = await statIfExist(absolutePath);
            } else {
                for (const absoluteDocumentRoot of absoluteDocumentRoots) {
                    absolutePath = path.join(absoluteDocumentRoot, relativePath);
                    stats = await statIfExist(absolutePath);
                    if (stats && stats.isFile()) {
                        break;
                    } else {
                        absolutePath = stats = null;
                    }
                }
            }
            if (stats && absolutePath) {
                return {path: absolutePath, relativePath, stats};
            }
            throw Object.assign(new Error(`Cannot find the file: ${relativePath}`), {code: 'ENOENT'});
        },
        {
            documentRoots: absoluteDocumentRoots,
            isReserved: (relativePath: string) => relativePath in reservedPaths,
        },
    );
};
