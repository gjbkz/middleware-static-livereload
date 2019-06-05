import * as fs from 'fs';
import * as util from 'util';

export const stat = util.promisify(fs.stat);
export const statIfExist = (
    filePath: string,
): Promise<fs.Stats | null> => stat(filePath)
.catch((error) => {
    if (error.code === 'ENOENT') {
        return null;
    }
    throw error;
});
