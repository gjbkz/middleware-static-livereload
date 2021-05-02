import * as fs from 'fs';

const ignoreENOENT = (error: unknown) => {
    if ((error as {code: string}).code === 'ENOENT') {
        return null;
    } else {
        throw error;
    }
};

export const statOrNull = async (filePath: string): Promise<fs.Stats | null> => await fs.promises.stat(filePath).catch(ignoreENOENT);
