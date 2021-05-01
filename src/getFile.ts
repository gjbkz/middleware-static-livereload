import * as path from 'path';
import type {FileInfo} from './types';
import {statOrNull} from './statOrNull';
import {LibError} from './LibError';

export const getFile = async (
    absolutePath: string,
    baseDirectory: string = process.cwd(),
): Promise<FileInfo> => {
    const relativePath = path.relative(baseDirectory, absolutePath);
    const stats = await statOrNull(absolutePath);
    if (stats && stats.isFile()) {
        return {
            path: absolutePath,
            relativePath,
            stats,
        };
    }
    throw new LibError('ENOENT', relativePath);
};
