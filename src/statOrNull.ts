import * as fs from 'fs';

const ignoreENOENT = (error: unknown) => {
    if ((error as {code: string}).code === 'ENOENT') {
        return null;
    } else {
        throw error;
    }
};

export const statOrNull = async (filePath: fs.PathLike): Promise<fs.Stats | null> => {
    return await fs.promises.stat(filePath).catch(ignoreENOENT);
};
