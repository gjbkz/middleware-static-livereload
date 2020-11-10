import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

export const readdir = util.promisify(fs.readdir);
export const stat = util.promisify(fs.stat);
export const writeFile = util.promisify(fs.writeFile);
export const mkdirpSync = (directory: string) => {
    try {
        fs.mkdirSync(directory);
    } catch (error: unknown) {
        switch ((error as {code: string}).code) {
        case 'EEXIST':
            if (fs.statSync(directory).isDirectory()) {
                return;
            }
            break;
        case 'ENOENT':
            mkdirpSync(path.dirname(directory));
            fs.mkdirSync(directory);
            return;
        default:
        }
        throw error;
    }
};

export const writeFilep = async (
    filePath: string,
    data: Buffer | string,
): Promise<void> => {
    try {
        await writeFile(filePath, data);
    } catch (error: unknown) {
        if ((error as {code: string}).code === 'ENOENT') {
            mkdirpSync(path.dirname(filePath));
            await writeFile(filePath, data);
        } else {
            throw error;
        }
    }
};

export const statIfExist = async (
    filePath: string,
): Promise<fs.Stats | null> => {
    try {
        const stats = await stat(filePath);
        return stats;
    } catch (error: unknown) {
        if ((error as {code: string}).code === 'ENOENT') {
            return null;
        } else {
            throw error;
        }
    }
};
