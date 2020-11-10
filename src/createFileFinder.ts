import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {ensureArray} from './ensureArray';
import {IFileFinder, IOptions} from './types';
import {absolutify} from './absolutify';
import {statIfExist, writeFile} from './fs';
import {generateIndexHTML} from './generateIndexHTML';
import {LibError} from './LibError';

export const createFileFinder = (
    {documentRoot = process.cwd(), index = 'index.html'}: IOptions = {},
    reservedPaths: Record<string, string> = {},
): IFileFinder => {
    const absoluteDocumentRoots = ensureArray(documentRoot).map((pathString) => absolutify(pathString));
    const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'node-server-'));
    return Object.assign(
        async (pathname: string) => {
            let relativePath = pathname.split('/').filter((x) => x).join(path.sep);
            let absolutePath = reservedPaths[pathname] || null;
            let stats: fs.Stats | null = null;
            if (absolutePath) {
                stats = await statIfExist(absolutePath);
            } else {
                for (const absoluteDocumentRoot of absoluteDocumentRoots) {
                    absolutePath = path.join(absoluteDocumentRoot, relativePath);
                    stats = await statIfExist(absolutePath);
                    if (stats) {
                        if (stats.isFile()) {
                            break;
                        } else if (stats.isDirectory()) {
                            stats = await statIfExist(path.join(absolutePath, index));
                            if (stats && stats.isFile()) {
                                absolutePath = path.join(absolutePath, index);
                                relativePath = path.join(relativePath, index);
                            } else {
                                const indexHTML = await generateIndexHTML(absolutePath, relativePath);
                                absolutePath = path.join(temporaryDirectory, `${relativePath.split(path.sep).join('sep')}.html`);
                                await writeFile(absolutePath, indexHTML);
                                stats = await statIfExist(absolutePath);
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
