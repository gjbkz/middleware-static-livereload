import * as path from 'path';
import {LibError} from './LibError.ts';
import {statOrNull} from './statOrNull.ts';
import type {FileInfo} from './types.ts';

export const getFile = async (
    absolutePath: string,
    baseDirectory: string = process.cwd(),
): Promise<FileInfo> => {
    const relativePath = path.relative(baseDirectory, absolutePath);
    const stats = await statOrNull(absolutePath);
    if (stats?.isFile()) {
        return {
            path: absolutePath,
            relativePath,
            stats,
        };
    }
    throw new LibError('ENOENT', relativePath);
};
