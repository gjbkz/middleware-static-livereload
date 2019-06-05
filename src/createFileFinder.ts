import * as path from 'path';
import {ensureArray} from './ensureArray';
import {IFileFinder} from './types';
import {absolutify} from './absolutify';
import {statIfExist} from './fs';

export const createFileFinder = (
    documentRoot: string | Array<string>,
    index: string,
    baseDirectory: string,
): IFileFinder => {
    const absoluteDocumentRoots = ensureArray(documentRoot)
    .map((documentRoot) => absolutify(documentRoot, baseDirectory));
    return async (
        pathname: string,
    ) => {
        const relativePath = pathname.replace(/\/$/, index).split('/').join(path.sep);
        for (const absoluteDocumentRoot of absoluteDocumentRoots) {
            const absolutePath = path.join(absoluteDocumentRoot, relativePath);
            const stats = await statIfExist(absolutePath);
            if (stats && stats.isFile()) {
                return {file: absolutePath, stats};
            }
        }
        throw Object.assign(
            new Error(`Cannot find the file: ${pathname}`),
            {code: 'ENOENT'},
        );
    };
};
