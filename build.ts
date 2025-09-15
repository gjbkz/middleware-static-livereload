import fs from "node:fs/promises";
import { builtinModules } from "node:module";
import { build, type Format } from "esbuild";

const externalModules = new Set<string>();
{
	for (const name of builtinModules) {
		externalModules.add(`node:${name}`);
	}
	const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
	if ("dependencies" in pkg && typeof pkg.dependencies === "object") {
		for (const name of Object.keys(pkg.dependencies)) {
			externalModules.add(name);
		}
	}
}

const modeList: Array<{ format: Format; ext: string }> = [
	{ format: "esm", ext: ".mjs" },
	{ format: "cjs", ext: ".cjs" },
];

for (const { format, ext } of modeList) {
	await build({
		entryPoints: ["src/middleware.ts"],
		outfile: `${format}/middleware${ext}`,
		format,
		bundle: true,
		loader: { ".ts": "ts" },
		external: [...externalModules],
		treeShaking: true,
	});
}
