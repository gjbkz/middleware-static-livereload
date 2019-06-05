import * as path from 'path';

export const absolutify = (
    filePath: string,
    baseDirectory: string,
) => path.isAbsolute(filePath) ? filePath : path.join(baseDirectory, filePath);
