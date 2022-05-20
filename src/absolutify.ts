import type * as fs from 'fs';
import * as path from 'path';
import {pathToFileURL} from 'url';

export const absolutify = (
    filePath: fs.PathLike,
    baseDirectory: string = process.cwd(),
) => {
    if (typeof filePath === 'string' || Buffer.isBuffer(filePath)) {
        filePath = `${filePath}`;
        return pathToFileURL(path.isAbsolute(filePath) ? filePath : path.join(baseDirectory, `${filePath}`));
    }
    return filePath;
};
