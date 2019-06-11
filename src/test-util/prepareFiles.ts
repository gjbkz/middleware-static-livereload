import * as path from 'path';
import {writeFile} from '../fs';

export const prepareFiles = (
    files: {
        [path: string]: Buffer,
    },
    directory: string,
): Promise<Array<void>> => Promise.all(
    Object.keys(files).map(async (relativePath) => {
        const dest = path.join(directory, relativePath);
        const content = files[relativePath];
        await writeFile(dest, content);
    }),
);
