//@ts-check
import { readFileSync, writeFileSync } from "node:fs";

const src = new URL("./src/clientScript.js", import.meta.url);
const dest = new URL("./src/clientScript.ts", import.meta.url);

const code = readFileSync(src, "utf-8");
writeFileSync(
	dest,
	`export const clientScript = Buffer.from(${JSON.stringify(code)});`,
);
