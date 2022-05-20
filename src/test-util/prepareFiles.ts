import * as fs from 'fs';
import * as path from 'path';

export const prepareFiles = async (
    files: Record<string, Buffer | string>,
    directory: string,
): Promise<void> => {
    const paths = Object.keys(files).sort((a, b) => a.localeCompare(b));
    for (const relativePath of paths) {
        const dest = path.join(directory, ...relativePath.split('/'));
        const content = files[relativePath];
        await fs.promises.mkdir(path.dirname(dest), {recursive: true});
        await fs.promises.writeFile(dest, content);
    }
};
