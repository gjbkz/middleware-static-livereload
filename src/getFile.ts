import * as path from 'path';
import {IFile} from './types';
import {statIfExist} from './fs';
import {LibError} from './LibError';

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
    throw new LibError('ENOENT', relativePath);
};
