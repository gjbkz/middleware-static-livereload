import * as fs from 'node:fs';
import { isErrorWithCode } from './isErrorWithCode.ts';

export const statOrNull = async (
  filePath: fs.PathLike,
): Promise<fs.Stats | null> => {
  try {
    return await fs.promises.stat(filePath);
  } catch (error) {
    if (isErrorWithCode(error) && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};
