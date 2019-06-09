import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export const createTemporaryDirectory = (
    prefix: string = 'temp-',
): Promise<string> => new Promise((resolve, reject) => {
    fs.mkdtemp(path.join(os.tmpdir(), prefix), (error, directory) => {
        if (error) {
            reject(error);
        } else {
            resolve(directory);
        }
    });
});
