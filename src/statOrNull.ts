import * as fs from 'fs';

export const statOrNull = async (
    filePath: string,
): Promise<fs.Stats | null> => {
    try {
        const stats = await fs.promises.stat(filePath);
        return stats;
    } catch (error: unknown) {
        if ((error as {code: string}).code === 'ENOENT') {
            return null;
        } else {
            throw error;
        }
    }
};
