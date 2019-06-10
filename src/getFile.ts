import * as path from 'path';
import {IFile} from './types';
import {statIfExist} from './fs';

export const getFile = async (
    absolutePath: string,
    baseDirectory: string = process.cwd(),
): Promise<IFile> => {
    const relativePath = path.relative(baseDirectory, absolutePath);
    const stats = await statIfExist(absolutePath);
    if (stats && stats.isFile()) {
        return {
            path: absolutePath,
            relativePath,
            stats,
        };
    }
    throw Object.assign(
        new Error(`Cannot find the file: ${relativePath}`),
        {code: 'ENOENT'},
    );
};
