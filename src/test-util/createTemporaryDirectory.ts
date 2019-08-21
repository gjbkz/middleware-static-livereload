import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export const createTemporaryDirectory = async (
    prefix = 'temp-',
): Promise<string> => {
    const directory = await new Promise<string>((resolve, reject) => {
        fs.mkdtemp(path.join(os.tmpdir(), prefix), (error, directory) => {
            if (error) {
                reject(error);
            } else {
                resolve(directory);
            }
        });
    });
    return directory;
};
