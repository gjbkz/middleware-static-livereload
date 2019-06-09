import * as path from 'path';

export const absolutify = (
    filePath: string,
    baseDirectory: string = process.cwd(),
) => path.isAbsolute(filePath) ? filePath : path.join(baseDirectory, filePath);
