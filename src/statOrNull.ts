import type { PathLike, Stats } from "node:fs";
import { stat } from "node:fs/promises";
import { isErrorWithCode } from "./isErrorWithCode.ts";

export const statOrNull = async (filePath: PathLike): Promise<Stats | null> => {
	try {
		return await stat(filePath);
	} catch (error) {
		if (isErrorWithCode(error) && error.code === "ENOENT") {
			return null;
		}
		throw error;
	}
};
