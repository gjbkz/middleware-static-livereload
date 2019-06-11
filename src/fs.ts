import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

export const readdir = util.promisify(fs.readdir);
export const stat = util.promisify(fs.stat);
export const writeFile = util.promisify(fs.writeFile);
export const mkdirpSync = (directory: string) => {
    try {
        fs.mkdirSync(directory);
    } catch (error) {
        switch (error.code) {
        case 'EEXIST':
            if (fs.statSync(directory).isDirectory()) {
                return;
            }
            break;
        case 'ENOENT':
            mkdirpSync(path.dirname(directory));
            fs.mkdirSync(directory);
            break;
        default:
        }
        throw error;
    }
};
export const writeFilep = (
    filePath: string,
    data: Buffer | string,
): Promise<void> => writeFile(filePath, data)
.catch((error) => {
    if (error.code === 'ENOENT') {
        mkdirpSync(path.dirname(filePath));
        return writeFile(filePath, data);
    }
    throw error;
});
export const statIfExist = (
    filePath: string,
): Promise<fs.Stats | null> => stat(filePath)
.catch((error) => {
    if (error.code === 'ENOENT') {
        return null;
    }
    throw error;
});
export const statIfExistSync = (
    filePath: string,
): fs.Stats | null => {
    try {
        return fs.statSync(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
};
