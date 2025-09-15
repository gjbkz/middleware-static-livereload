//@ts-check
import { readFileSync, writeFileSync } from "node:fs";

const src = new URL("./src/clientScript.js", import.meta.url);
const dest = new URL("./src/clientScript.ts", import.meta.url);

const code = readFileSync(src, "utf-8");
writeFileSync(
	dest,
	`/* biome-ignore-all lint/suspicious/noTemplateCurlyInString: intended */\nexport const clientScript = Buffer.from(${JSON.stringify(code)});\n`,
);
