import type * as fs from 'fs';
import * as path from 'path';
import {pathToFileURL} from 'url';

export const pathLikeToFileUrl = (absolutePathLike: fs.PathLike) => {
    if (typeof absolutePathLike === 'string' || Buffer.isBuffer(absolutePathLike)) {
        return pathToFileURL(path.normalize(`${absolutePathLike}`));
    }
    return absolutePathLike;
};
