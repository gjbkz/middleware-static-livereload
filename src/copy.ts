import * as fs from 'fs';
import * as console from 'console';
import * as path from 'path';
import {fileURLToPath, pathToFileURL} from 'url';

const toFileUrl = (pathLike: fs.PathLike) => {
    if (typeof pathLike === 'string' || Buffer.isBuffer(pathLike)) {
        return pathToFileURL(path.normalize(`${pathLike}`));
    }
    return pathLike;
};

export const copy = async (src: fs.PathLike, dest: fs.PathLike): Promise<void> => {
    src = toFileUrl(src);
    dest = toFileUrl(dest);
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
