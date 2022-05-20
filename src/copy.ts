import * as console from 'console';
import * as fs from 'fs';
import {fileURLToPath} from 'url';
import {pathLikeToFileUrl} from './pathLikeToFileUrl';

export const copy = async (src: fs.PathLike, dest: fs.PathLike): Promise<void> => {
    src = pathLikeToFileUrl(src);
    dest = pathLikeToFileUrl(dest);
    if ((await fs.promises.stat(src)).isDirectory()) {
        await fs.promises.mkdir(dest, {recursive: true});
        for (const name of await fs.promises.readdir(src)) {
            await copy(new URL(name, src), new URL(name, dest));
        }
    } else {
        await fs.promises.copyFile(src, dest);
        console.info(`Copied: ${src} → ${dest}`);
    }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const [src, dest] = process.argv.slice(-2);
    copy(src, dest).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
