import * as assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { FileFinder } from './FileFinder.ts';

test('find .txt', async () => {
  const dir = await mkdtemp(tmpdir());
  const file1 = 'file1.txt';
  await writeFile(join(dir, file1), file1);
  const fileFinder = new FileFinder({
    documentRoot: [dir],
    baseDir: process.cwd(),
    index: 'index.html',
  });
  const result = await fileFinder.findFile('/file1.txt');
  assert.equal(result.relativePath, '/file1.txt');
});

test('find index', async () => {
  const dir = await mkdtemp(tmpdir());
  const file1 = 'file1.txt';
  await writeFile(join(dir, file1), file1);
  const fileFinder = new FileFinder({
    documentRoot: [dir],
    baseDir: process.cwd(),
    index: 'file1.txt',
  });
  const result = await fileFinder.findFile('/');
  assert.equal(result.relativePath, '/file1.txt');
});

test('generate index', async () => {
  const dir = await mkdtemp(tmpdir());
  const file1 = 'file1.txt';
  await writeFile(join(dir, file1), file1);
  const fileFinder = new FileFinder({
    documentRoot: [dir],
    baseDir: process.cwd(),
    index: 'index.html',
  });
  const result = await fileFinder.findFile('/');
  assert.equal(result.relativePath, '/');
  const html = await readFile(result.fileUrl);
  assert.ok(html.includes('<title>Index of /</title>'));
  assert.ok(html.includes('<a href="./file1.txt"'));
});

test('return from reservedPaths', async () => {
  const dir = pathToFileURL(process.cwd());
  const fileFinder = new FileFinder(
    { documentRoot: [dir], baseDir: process.cwd(), index: 'index.html' },
    { '/foo': dir },
  );
  const result = await fileFinder.findFile('/foo');
  assert.equal(result.relativePath, '/foo');
  assert.deepEqual(result.fileUrl, dir);
});

test('documentRoots is public', () => {
  const dir = pathToFileURL(process.cwd());
  const fileFinder = new FileFinder({
    documentRoot: [dir],
    baseDir: process.cwd(),
    index: 'index.html',
  });
  assert.deepEqual(fileFinder.documentRoots, [dir]);
});
