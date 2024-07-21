import type { PathLike } from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

export const pathLikeToFileUrl = (pathLike: PathLike, baseDir: string): URL => {
  if (typeof pathLike === 'string' || Buffer.isBuffer(pathLike)) {
    pathLike = `${pathLike}`;
    return pathToFileURL(
      path.isAbsolute(pathLike) ? pathLike : path.join(baseDir, pathLike),
    );
  }
  return pathLike;
};
