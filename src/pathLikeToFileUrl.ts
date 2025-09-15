import type { PathLike } from "node:fs";
import { isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";

export const pathLikeToFileUrl = (pathLike: PathLike, baseDir: string): URL => {
	if (typeof pathLike === "string" || Buffer.isBuffer(pathLike)) {
		pathLike = `${pathLike}`;
		return pathToFileURL(
			isAbsolute(pathLike) ? pathLike : join(baseDir, pathLike),
		);
	}
	return pathLike;
};
