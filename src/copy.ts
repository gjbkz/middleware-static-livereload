import {promises as afs} from 'fs';
import * as console from 'console';
import * as path from 'path';

export const copy = async (src: string, dest: string): Promise<void> => {
    src = path.normalize(src);
    dest = path.normalize(dest);
    if ((await afs.stat(src)).isDirectory()) {
        await afs.mkdir(dest, {recursive: true});
        for (const name of await afs.readdir(src)) {
            await copy(path.join(src, name), path.join(dest, name));
        }
    } else {
        await afs.copyFile(src, dest);
        console.info(`Copied: ${src} → ${dest}`);
    }
};

if (require.main === module) {
    const [src, dest] = process.argv.slice(-2);
    copy(src, dest)
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
