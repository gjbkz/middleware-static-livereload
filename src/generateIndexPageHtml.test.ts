import * as assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { generateIndexPageHtml } from './generateIndexPageHtml.ts';

test('generateIndexPageHtml', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'generateIndexPageHtml-'));
  const file1 = 'file1.txt';
  await writeFile(join(dir, file1), file1);
  const file2 = 'fileあ>.txt';
  await writeFile(join(dir, file2), file2);
  const dir1 = 'dir1';
  await mkdir(join(dir, dir1));
  const dir1file1 = 'dir1file1.txt';
  await writeFile(join(dir, dir1, dir1file1), dir1file1);
  const actual = await generateIndexPageHtml(pathToFileURL(dir), 'foo');
  assert.ok(actual.includes('<a href="./file1.txt">file1.txt</a>'));
  assert.ok(
    actual.includes('<a href="./file%E3%81%82%3E.txt">fileあ&gt;.txt</a>'),
  );
  assert.ok(actual.includes('<a href="./dir1/">dir1/</a>'));
  assert.ok(!actual.includes(dir1file1));
});
