import * as path from 'path';
import {writeFilep} from '../fs';

export const prepareFiles = async (
    files: Record<string, Buffer>,
    directory: string,
): Promise<void> => {
    const paths = Object.keys(files).sort((a, b) => a.localeCompare(b));
    for (const relativePath of paths) {
        const dest = path.join(directory, relativePath);
        const content = files[relativePath];
        await writeFilep(dest, content);
    }
};
