import * as path from 'path';
import * as fs from 'fs';

export const prepareFiles = async (
    files: {
        [path: string]: Buffer,
    },
    directory: string,
): Promise<Array<string>> => Promise.all(
    Object.keys(files)
    .map((relativePath) => new Promise((resolve, reject) => {
        const filePath = path.join(directory, relativePath);
        fs.writeFile(
            filePath,
            files[relativePath],
            (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            },
        );
    })),
);
