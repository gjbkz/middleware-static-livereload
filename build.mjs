//@ts-check
import { mkdirSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const srcDir = new URL('./src/', import.meta.url);
const destDir = new URL('./lib/', import.meta.url);
/** @type {{dependencies: Record<string, string>}} */
const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
);
const external = [...builtinModules];
if (typeof packageJson === 'object' && packageJson) {
  const { dependencies } = packageJson;
  if (dependencies) {
    external.push(...Object.keys(dependencies));
  }
}

mkdirSync(destDir, { recursive: true });
for (const name of readdirSync(destDir, {
  encoding: 'utf-8',
  recursive: true,
})) {
  unlinkSync(new URL(name, destDir));
}

const src = new URL('middleware.ts', srcDir);
esbuild.buildSync({
  entryPoints: [fileURLToPath(src)],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node12',
  loader: { '.ts': 'ts' },
  outdir: fileURLToPath(destDir),
  external,
});
